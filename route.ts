import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured on the server.' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const prompt = body.prompt as string

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    })

    const data = await geminiRes.json()

    if (!geminiRes.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'Gemini API error' },
        { status: geminiRes.status }
      )
    }

    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return NextResponse.json({ text })
  } catch (err) {
    console.error('Gemini route error:', err)
    return NextResponse.json({ error: 'Server error calling Gemini' }, { status: 500 })
  }
}
