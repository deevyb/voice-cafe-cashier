import { NextResponse } from 'next/server'

export async function POST() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime-mini',
          audio: {
            output: {
              voice: 'marin',
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI client_secrets error:', response.status, errorText)
      return NextResponse.json(
        { error: `Failed to create session token: ${response.status}` },
        { status: 500 }
      )
    }

    const data = await response.json()

    const resolvedKey = data.client_secret?.value || data.value
    // Return the ephemeral key
    return NextResponse.json({ key: resolvedKey })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
