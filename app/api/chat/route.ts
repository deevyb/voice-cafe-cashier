import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { ORDER_TOOLS, OPENAI_STORED_PROMPT_ID } from '@/lib/realtime-config'
import { applyToolCall } from '@/lib/cart-utils'
import type { CartItem } from '@/lib/supabase'

const model = process.env.OPENAI_TEXT_MODEL || 'gpt-5.2'
const MAX_TOOL_ITERATIONS = 6

type InputMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ParsedToolCall = {
  name: string
  call_id: string
  arguments: Record<string, any>
}

function parseResponse(response: any) {
  const toolCalls: ParsedToolCall[] = []
  let text = ''

  for (const item of response?.output || []) {
    if (item?.type === 'function_call') {
      let args: Record<string, any> = {}
      try {
        args = JSON.parse(item.arguments || '{}')
      } catch {
        args = {}
      }
      toolCalls.push({ name: item.name, call_id: item.call_id, arguments: args })
    }

    if (item?.type === 'message' && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part?.type === 'output_text' && part.text) {
          text += part.text
        }
      }
    }
  }

  return { text: text.trim(), toolCalls }
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }

    if (!OPENAI_STORED_PROMPT_ID) {
      return NextResponse.json(
        { error: 'OPENAI_STORED_PROMPT_ID is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const messages = (body.messages || []) as InputMessage[]
    let cart = (body.cart || []) as CartItem[]

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const input: any[] = [
      { role: 'system', content: `Current cart JSON: ${JSON.stringify(cart)}` },
      ...messages,
    ]

    let response = await client.responses.create({
      model,
      input,
      tools: ORDER_TOOLS,
      prompt: { id: OPENAI_STORED_PROMPT_ID },
    } as any)

    let finalText = ''
    let finalize: { customer_name: string } | undefined
    let iteration = 0

    while (iteration < MAX_TOOL_ITERATIONS) {
      const parsed = parseResponse(response)

      if (parsed.text) {
        finalText = parsed.text
      }

      if (parsed.toolCalls.length === 0) {
        break
      }

      // Execute all tool calls and build function_call_output items
      const outputItems: any[] = []
      for (const call of parsed.toolCalls) {
        const result = applyToolCall(cart, call.name, call.arguments)
        cart = result.cart
        if (result.finalize) finalize = result.finalize

        outputItems.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify({ success: true, cart }),
        })
      }

      // Continue conversation with tool results
      response = await client.responses.create({
        model,
        input: outputItems,
        tools: ORDER_TOOLS,
        prompt: { id: OPENAI_STORED_PROMPT_ID },
        previous_response_id: response.id,
      } as any)

      iteration++
    }

    return NextResponse.json({ text: finalText, cart, finalize })
  } catch (error) {
    console.error('Chat route error:', error)
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 })
  }
}
