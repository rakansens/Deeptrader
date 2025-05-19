import { NextResponse } from 'next/server';
import { OpenAIStream, StreamingTextResponse } from 'ai';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
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
        stream: true,
        messages,
      }),
    });

    if (!res.ok || !res.body) {
      const text = await res.text();
      return NextResponse.json(
        { error: 'OpenAI request failed', detail: text },
        { status: res.status }
      );
    }

    const stream = OpenAIStream(res);
    return new StreamingTextResponse(stream);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
