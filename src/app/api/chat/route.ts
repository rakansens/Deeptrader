import { NextResponse } from "next/server";
import { StreamingTextResponse } from "ai";
import { orchestratorAgent } from "@/mastra/agents/orchestratorAgent";
import { logger } from "@/lib/logger";
import type { Message } from "@/types";
import { createRouteHandlerClient } from "@/utils/supabase/route-handler";

/**
 * Chat API (Mastra version - AI SDK真ストリーミング版)
 * MastraのbaseStreamをAI SDKのStreamingTextResponseで真のストリーミングとして提供
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

    // --- OrchestratorAgent へ送信（AI SDK真ストリーミング版）---
    logger.info("🔍 Mastraエージェント実行中...");
    
    try {
      const result = await orchestratorAgent.stream(transcript);
      logger.info("🔍 Mastraエージェントの結果タイプ:", typeof result);
      
      // baseStreamを検索してAI SDKでストリーミング
      if (result && typeof result === 'object' && 'baseStream' in result) {
        logger.info("✅ baseStreamを発見、AI SDKストリーミング変換を開始");
        const baseStream = (result as any).baseStream;
        
        if (baseStream instanceof ReadableStream) {
          // MastraのオブジェクトストリームをAI SDK互換のテキストストリームに変換
          const textStream = new ReadableStream({
            async start(controller) {
              try {
                const reader = baseStream.getReader();
                
                while (true) {
                  const { done, value } = await reader.read();
                  
                  if (done) {
                    controller.close();
                    break;
                  }
                  
                  // Mastraオブジェクトからテキストを抽出
                  let textToStream: string = "";
                  
                  if (typeof value === 'string') {
                    textToStream = value;
                  } else if (value && typeof value === 'object') {
                    // MastraのJSONオブジェクトからテキストデルタを抽出
                    if (value.part?.type === "text-delta" && value.part.textDelta) {
                      textToStream = value.part.textDelta;
                    }
                  } else {
                    textToStream = String(value);
                  }
                  
                  // テキストが存在する場合のみストリーミング
                  if (textToStream) {
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(textToStream));
                  }
                }
              } catch (error) {
                logger.error("AI SDKストリーム変換エラー:", error);
                controller.error(error);
              }
            }
          });
          
          // AI SDKのStreamingTextResponseを使用
          return new StreamingTextResponse(textStream);
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
