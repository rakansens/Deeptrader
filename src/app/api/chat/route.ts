import { NextResponse } from "next/server";
import { StreamingTextResponse } from "ai";
// import { orchestratorAgent } from "@/mastra/agents/orchestratorAgent";
import { logger } from "@/lib/logger";
import type { Message } from "@/types";
import { createRouteHandlerClient } from "@/utils/supabase/route-handler";

/**
 * Chat API (Mastra version)
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

    // TODO: Mastraエージェント統合（一時的に無効化）
    // const mastraStream = await orchestratorAgent.stream(transcript);
    
    // 一時的なレスポンス（Mastraエージェント修正後に復元）
    const responseText = `現在、システムは基本機能で動作しています。

受信したメッセージ: ${messages.length}件
最新のメッセージ: ${messages[messages.length - 1]?.content || 'なし'}

Mastraエージェント統合は準備中です。`;

    // Simple readable stream for testing
    const stream = new ReadableStream({
      start(controller) {
        try {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(responseText));
          controller.close();
        } catch (e) {
          console.error("Streaming error:", e);
          controller.error(e);
        }
      }
    });
    
    // 標準の StreamingTextResponse を使用
    return new StreamingTextResponse(stream);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Chat API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
