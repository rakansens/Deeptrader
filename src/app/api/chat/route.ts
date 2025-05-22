import { NextResponse } from "next/server";
import { StreamingTextResponse } from "ai";
import { orchestratorAgent } from "@/mastra/agents/orchestratorAgent";
import { logger } from "@/lib/logger";
import type { Message } from "@/types";
import { createRouteHandlerClient } from "@/utils/supabase/route-handler";

/**
 * Chat API (Mastra version - ストリーム変換修正版)
 * すべてのチャットメッセージを Mastra の OrchestratorAgent に委譲する。
 *
 * 現時点で Mastra は画像メッセージを直接扱えないため、
 * 画像が含まれる場合は `(画像メッセージ: [Image omitted])` へ置き換えて送信する。
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // ユーザー認証チェック
    const supabase = await createRouteHandlerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      logger.warn("認証されていないユーザーからのリクエスト");
      // 本番環境では401を返すべきかもしれませんが、デモ用に許可します
      // return NextResponse.json({ error: "未認証" }, { status: 401 });
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

    // --- OrchestratorAgent へ送信（ストリーム変換修正版）---
    logger.info("🔍 Mastraエージェント実行中...");
    
    try {
      const result = await orchestratorAgent.stream(transcript);
      logger.info("🔍 Mastraエージェントの結果タイプ:", typeof result);
      
      // DefaultStreamTextResultからbaseStreamを取得
      if (result && typeof result === 'object' && 'baseStream' in result) {
        logger.info("✅ baseStreamを発見、ストリーミング変換を開始");
        const baseStream = (result as any).baseStream;
        
        if (baseStream instanceof ReadableStream) {
          // MastraのObjectストリームを文字列ストリームに変換
          const textStream = new ReadableStream({
            async start(controller) {
              try {
                const reader = baseStream.getReader();
                const decoder = new TextDecoder();
                
                while (true) {
                  const { done, value } = await reader.read();
                  
                  if (done) {
                    controller.close();
                    break;
                  }
                  
                  // MastraのObjectを文字列に変換
                  let textChunk: string;
                  if (typeof value === 'string') {
                    textChunk = value;
                  } else if (value && typeof value === 'object') {
                    // オブジェクトの場合、テキスト部分を抽出
                    textChunk = value.text || value.content || value.delta || JSON.stringify(value);
                  } else if (value instanceof Uint8Array) {
                    textChunk = decoder.decode(value, { stream: true });
                  } else {
                    textChunk = String(value);
                  }
                  
                  // 文字列をUint8Arrayに変換してエンキュー
                  if (textChunk) {
                    controller.enqueue(new TextEncoder().encode(textChunk));
                  }
                }
              } catch (error) {
                logger.error("ストリーム変換エラー:", error);
                controller.error(error);
              }
            }
          });
          
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
