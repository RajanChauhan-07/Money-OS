import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const PRIMARY_MODEL = 'llama3-70b-8192'
const FALLBACK_MODEL = 'llama-3.1-8b-instant'

export async function POST(request: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      console.error('[Chat API] Missing GROQ_API_KEY')
      return NextResponse.json(
        { error: 'Groq API key not configured.' },
        { status: 500 }
      )
    }

    const { messages, context } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 })
    }

    // Build system prompt with context
    const systemPrompt = `
You are an expert Indian Chartered Accountant (CA) and tax advisor built into Money OS.
Your job is to answer the user's questions specifically based on their calculated tax profile below.

TAX KNOWLEDGE BASE (LATEST BUDGET 2025 - FY 2025-26):
- NEW REGIME (u/s 115BAC): 0-4L (Nil), 4-8L (5%), 8-12L (10%), 12-16L (15%), 16-20L (20%), 20-24L (25%), >24L (30%). Std Ded: ₹75,000.
- OLD REGIME: 0-2.5L (Nil), 2.5-5L (5%), 5-10L (20%), >10L (30%). Std Ded: ₹50,000.
- SURCHARGES: >50L (10%), >1Cr (15%), >2Cr (25%). New Regime cap is 25%. Old Regime goes up to 37% (>5Cr).
- REBATE 87A: Full rebate if taxable income <= 12L (New Regime) or <= 5L (Old Regime).

FORMATTING RULES (STRICT):
- NEVER use markdown bold (no ** allowed anywhere).
- Use clean bullet points (-) for lists.
- Use simple CAPITALIZED text for headings or emphasis if needed.

USER TAX PROFILE CONTEXT:
${JSON.stringify(context, null, 2)}
`

    // Filter out the initial greeting if it's the first message to satisfy API constraints
    // (Conversation must start with a User message after System)
    const apiMessages = messages
      .map((m: any) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content
      }))
    
    // Ensure the first message after system is a 'user' message
    let finalMessages = [{ role: 'system', content: systemPrompt }]
    const firstUserIndex = apiMessages.findIndex(m => m.role === 'user')
    
    if (firstUserIndex !== -1) {
      finalMessages = [...finalMessages, ...apiMessages.slice(firstUserIndex)]
    } else {
      finalMessages = [...finalMessages, ...apiMessages]
    }

    let response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${GROQ_API_KEY.trim()}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        model: PRIMARY_MODEL,
        messages: finalMessages,
        temperature: 0.1,
        max_tokens: 1024
      })
    })

    // Fallback if primary model fails
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.warn(`[Chat API] Primary model ${PRIMARY_MODEL} failed:`, err)
      
      response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${GROQ_API_KEY.trim()}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          model: FALLBACK_MODEL,
          messages: finalMessages,
          temperature: 0.1,
          max_tokens: 1024
        })
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Chat API] Groq error status:', response.status)
      console.error('[Chat API] Groq error body:', errorText)
      let detail = ''
      try {
        const errJson = JSON.parse(errorText)
        detail = errJson.error?.message || errorText
      } catch (e) {
        detail = errorText
      }
      return NextResponse.json({ error: `Groq 400: ${detail.slice(0, 100)}` }, { status: 502 })
    }

    const data = await response.json()
    let reply = data.choices?.[0]?.message?.content

    if (!reply) {
      return NextResponse.json({ error: 'Empty response from Groq' }, { status: 500 })
    }

    // FINAL CLEANUP: Remove all ** markdown bolding symbols and extra whitespace
    reply = reply.replace(/\*\*/g, '').trim()

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[Chat API] Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
