import { NextResponse } from "next/server";
import { orchestratorAgent } from "@/mastra/agents/orchestratorAgent";
import { logger } from "@/lib/logger";
import type { Message } from "@/types";
import { createRouteHandlerClient } from "@/utils/supabase/route-handler";

/**
 * Chat API (Mastra version - 純粋ストリーミング版)
 * /chatページで成功している実装と同じ方式でMastraストリーミングを直接返す
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // ユーザー認証チェック
    const supabase = await createRouteHandlerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      logger.warn("認証されていないユーザーからのリクエスト");
    }

    const { messages }: { messages: Message[] } = await request.json();

    // --- Mastra に渡す transcript を生成 ---
    const transcript = messages
      .map((m) => {
        const role = m.role === "assistant" ? "アシスタント" : "ユーザー";

        // 画像メッセージはプレースホルダーに変換
        if (
          m.type === "image" ||
          (typeof m.content === "string" && m.content.startsWith("data:image/"))
        ) {
          return `${role}: (画像メッセージ: [Image omitted])`;
        }

        const content =
          typeof m.content === "string"
            ? m.content
            : JSON.stringify(m.content);
        return `${role}: ${content}`;
      })
      .join("\n");

    logger.debug("⇢ Transcript length:", transcript.length);

    // --- OrchestratorAgent へ送信（直接ストリーミング版）---
    logger.info("🔍 Mastraエージェント実行中...");
    
    try {
      const result = await orchestratorAgent.stream(transcript);
      logger.info("🔍 Mastraエージェントの結果タイプ:", typeof result);
      
      // baseStreamを検索してストリーミング
      if (result && typeof result === 'object' && 'baseStream' in result) {
        logger.info("✅ baseStreamを発見、ストリーミング変換を開始");
        const baseStream = (result as any).baseStream;
        
        if (baseStream instanceof ReadableStream) {
          // MastraのオブジェクトストリームをJSONテキストストリームに変換
          const responseStream = new ReadableStream({
            async start(controller) {
              try {
                const reader = baseStream.getReader();
                
                while (true) {
                  const { done, value } = await reader.read();
                  
                  if (done) {
                    controller.close();
                    break;
                  }
                  
                  // Mastraオブジェクトを文字列に変換
                  let textToSend: string;
                  if (typeof value === 'string') {
                    textToSend = value;
                  } else if (value && typeof value === 'object') {
                    // オブジェクトの場合はJSON文字列として送信
                    textToSend = JSON.stringify(value);
                  } else {
                    textToSend = String(value);
                  }
                  
                  // 改行を追加してJSON Linesフォーマットに
                  if (textToSend) {
                    controller.enqueue(new TextEncoder().encode(textToSend + '\n'));
                  }
                }
              } catch (error) {
                logger.error("ストリーム変換エラー:", error);
                controller.error(error);
              }
            }
          });
          
          // プレーンテキストとしてストリーミングレスポンスを返す（/chatページと同じ）
          return new Response(responseStream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Transfer-Encoding': 'chunked',
            },
          });
        } else {
          logger.warn("❌ baseStreamがReadableStreamではありません:", typeof baseStream);
        }
      }
      
      // フォールバック: 通常のレスポンス返却
      logger.warn("❌ baseStreamが見つからないか、期待される形式ではありません");
      
      // テキスト結果を待機して返す
      const textResult = typeof result === 'string' 
        ? result 
        : result && typeof result === 'object' && 'textPromise' in result
          ? await (result as any).textPromise
          : "Deeptraderシステムから: 現在、基本機能で動作中です。";
          
      return NextResponse.json({ message: textResult });
      
    } catch (mastraError) {
      logger.error("Mastraエージェントエラー:", mastraError);
      
      // エラー時のフォールバック
      return NextResponse.json({ 
        message: "申し訳ございませんが、現在システムに問題が発生しています。しばらく後でお試しください。" 
      });
    }
    
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Chat API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
