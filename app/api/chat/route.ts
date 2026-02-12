import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { ORDER_TOOLS, OPENAI_STORED_PROMPT_ID } from '@/lib/realtime-config'

const model = process.env.OPENAI_TEXT_MODEL || 'gpt-5.2'

type InputMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function parseResponse(response: any) {
  const toolCalls: { name: string; arguments: unknown }[] = []
  let text = ''

  for (const item of response?.output || []) {
    if (item?.type === 'function_call') {
      let args: unknown = {}
      try {
        args = JSON.parse(item.arguments || '{}')
      } catch {
        args = {}
      }
      toolCalls.push({ name: item.name, arguments: args })
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
    const cart = body.cart || []

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const input = [
      {
        role: 'system',
        content: `Current cart JSON: ${JSON.stringify(cart)}`,
      },
      ...messages,
    ]

    const response = await client.responses.create({
      model,
      input,
      tools: ORDER_TOOLS,
      prompt: { id: OPENAI_STORED_PROMPT_ID },
    } as any)

    const parsed = parseResponse(response)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Chat route error:', error)
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 })
  }
}
