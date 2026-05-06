import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured.' },
        { status: 500 }
      )
    }

    const { messages, context } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 })
    }

    // Convert standard chat messages to Gemini format
    const geminiContents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))

    // Add context to the first message if it exists
    if (context && geminiContents.length > 0 && geminiContents[0].role === 'user') {
      const systemContext = `
You are an expert Indian Chartered Accountant (CA) and tax advisor built into Money OS.
Your job is to answer the user's questions specifically based on their calculated tax profile below.
Do NOT give generic advice. Use their exact numbers.
Keep your answers brief, highly actionable, and easy to read. Use bullet points where appropriate.
If they ask why a regime is better, explain the mathematical difference based on their profile.

USER TAX PROFILE CONTEXT:
${JSON.stringify(context, null, 2)}
`
      geminiContents[0].parts[0].text = systemContext + "\n\nUser Question: " + geminiContents[0].parts[0].text
    }

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: geminiContents })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Chat API] Gemini error:', errorText)
      return NextResponse.json({ error: 'Failed to generate response' }, { status: 502 })
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!reply) {
      return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 500 })
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[Chat API] Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
