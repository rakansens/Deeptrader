import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing OpenAI API key' },
        { status: 500 }
      );
    }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: message }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: 'OpenAI request failed', detail: text },
        { status: res.status }
      );
    }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
