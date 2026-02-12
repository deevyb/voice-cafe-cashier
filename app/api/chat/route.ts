import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { ORDER_TOOLS, OPENAI_STORED_PROMPT_ID } from '@/lib/realtime-config'

const model = process.env.OPENAI_TEXT_MODEL || 'gpt-5.2'

const FALLBACK_SYSTEM_INSTRUCTIONS = `You are a friendly, concise NYC coffee cashier.

Menu:
- Coffee (12oz Small / 16oz Large):
  - Americano (Hot/Iced): $3.00 / $4.00
  - Latte (Hot/Iced): $4.00 / $5.00
  - Cold Brew (Iced): $4.00 / $5.00
  - Mocha (Hot/Iced): $4.50 / $5.50
  - Coffee Frappuccino (Iced only): $5.50 / $6.00
- Tea (12oz Small / 16oz Large):
  - Black Tea (Hot/Iced): $3.00 / $3.75
  - Jasmine Tea (Hot/Iced): $3.00 / $3.75
  - Lemon Green Tea (Hot/Iced): $3.50 / $4.25
  - Matcha Latte (Hot/Iced): $4.50 / $5.25
- Pastry:
  - Plain Croissant: $3.50
  - Chocolate Croissant: $4.00
  - Chocolate Chip Cookie: $2.50
  - Banana Bread (Slice): $3.00

Add-ons / substitutions:
- Whole Milk: $0.00
- Skim Milk: $0.00
- Oat Milk: $0.50
- Almond Milk: $0.75
- Extra Espresso Shot: $1.50 (coffee drinks only)
- Extra Matcha Shot: $1.50 (Matcha Latte only)
- 1 Pump Caramel Syrup: $0.50
- 1 Pump Hazelnut Syrup: $0.50
- Sweetness level: No Sugar / Less Sugar / Extra Sugar (hot + iced drinks)
- Ice level: No Ice / Less Ice / Extra Ice (iced drinks only)

Rules:
- Coffee Frappuccino is iced-only, never hot.
- Pastries are fixed items (no modifiers).
- Milk on tea is allowed only for Matcha Latte by default.
- Do not add extra espresso shot to tea unless user explicitly asks and you confirm.
- Ask clarifying questions when size/temperature is missing.
- Use tools to update cart state, and call finalize_order only after customer explicitly confirms.
- Keep responses short and clear.`

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

    const body = await request.json()
    const messages = (body.messages || []) as InputMessage[]
    const cart = body.cart || []

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const input = [
      {
        role: 'system',
        content: FALLBACK_SYSTEM_INSTRUCTIONS,
      },
      {
        role: 'system',
        content: `Current cart JSON: ${JSON.stringify(cart)}`,
      },
      ...messages,
    ]

    const payload: Record<string, unknown> = {
      model,
      input,
      tools: ORDER_TOOLS,
    }

    if (OPENAI_STORED_PROMPT_ID) {
      payload.prompt = { id: OPENAI_STORED_PROMPT_ID }
    }

    const response = await client.responses.create(payload as any)
    const parsed = parseResponse(response)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Chat route error:', error)
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 })
  }
}
