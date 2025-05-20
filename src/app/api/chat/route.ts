import { NextResponse } from 'next/server';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { logger } from '@/lib/logger';
import { fetchWithTimeout } from '@/lib/fetch';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    
    // リクエストログ（センシティブ情報は除外）
    logger.debug('Chat API request received with', messages.length, 'messages');
    
    // メッセージ形式の変換と最適化
    const openAIMessages = messages.map((m: any) => {
      // 画像メッセージの処理（データURLの場合）
      if (m.type === 'image' || (typeof m.content === 'string' && m.content.startsWith('data:image/'))) {
        const prompt = m.prompt || 'このチャートを分析してください';
        const imageUrl = typeof m.content === 'string' ? m.content : 
                        (Array.isArray(m.content) ? 
                          m.content.find((c: any) => c.type === 'image_url')?.image_url?.url : 
                          null);
        
        // 画像URLが見つからない場合
        if (!imageUrl) {
          logger.error('Image URL not found in message:', m);
          return { role: m.role, content: prompt };
        }
        
        logger.debug('Processing multimodal message with image');
        return {
          role: m.role,
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        };
      }
      
      // 通常のテキストメッセージ
      if (Array.isArray(m.content)) {
        // 既にマルチモーダル形式になっている場合はそのまま使用
        return { role: m.role, content: m.content };
      } else {
        // 普通のテキストメッセージ
        return { role: m.role, content: m.content };
      }
    });
    
    // API Key チェック
    if (!process.env.OPENAI_API_KEY) {
      logger.error('Missing OpenAI API key');
      return NextResponse.json(
        { error: 'Missing OpenAI API key' },
        { status: 500 }
      );
    }

    logger.debug('Sending request to OpenAI API');
    const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        stream: true,
        messages: openAIMessages,
        max_tokens: 1000,
      }),
      timeout: 10000,
    });

    if (!res.ok || !res.body) {
      const text = await res.text();
      logger.error('OpenAI API error:', text);
      return NextResponse.json(
        { error: 'OpenAI request failed', detail: text },
        { status: res.status }
      );
    }

    logger.debug('OpenAI API response received, streaming...');
    const stream = OpenAIStream(res);
    return new StreamingTextResponse(stream);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Chat API error:', errorMessage);
    return NextResponse.json({ error: 'Invalid request', detail: errorMessage }, { status: 400 });
  }
}
