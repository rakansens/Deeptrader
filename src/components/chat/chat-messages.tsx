"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import MessageBubble from "./message-bubble";
import type { Message } from "@/types";

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
  listRef: React.RefObject<HTMLDivElement>;
  userAvatar?: string;
  assistantAvatar?: string;
  setInput: (value: string) => void;
  sendMessage: (text: string) => void;
}

const suggestions = [
  "今日のビットコインはどう？",
  "イーサリアムの価格を教えて",
  "RSIインジケーターを表示して",
  "移動平均線（MA）を非表示にして",
  "このチャート、どう思う？ (まずチャート画像を送信してください)",
  "初心者向けの投資戦略を教えて",
];

/**
 * メッセージリストを表示するプレゼンテーショナルコンポーネント
 */
export function ChatMessages({
  messages,
  loading,
  error,
  listRef,
  userAvatar,
  assistantAvatar,
  setInput,
  sendMessage,
}: ChatMessagesProps) {
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading, listRef]);

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-y-auto space-y-2.5 pr-2 mt-2"
      aria-live="polite"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">
              DeepTrader AIへようこそ！
            </p>
            <p className="mb-1">あなたのパーソナル取引アシスタントです。</p>
            <p className="mb-4">
              下のように、市場分析、チャート操作、一般的な質問など、何でも聞いてみてくださいね。
            </p>
          </div>
          <div className="flex flex-col gap-1.5 mx-auto w-full max-w-sm">
            {suggestions.map((s) => (
              <Button
                key={s}
                variant="outline"
                className="text-xs h-auto py-1.5 px-2 justify-start text-left w-full"
                onClick={() => sendMessage(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((m, idx) => (
          <MessageBubble
            key={idx}
            role={m.role}
            timestamp={m.timestamp}
            avatar={m.role === "user" ? userAvatar : assistantAvatar}
            type={m.type}
            prompt={m.prompt}
            imageUrl={m.imageUrl}
          >
            {m.content}
          </MessageBubble>
        ))
      )}
      {loading && messages[messages.length - 1]?.role !== "assistant" && (
        <MessageBubble role="assistant" typing>
          <span className="text-sm">考え中...</span>
        </MessageBubble>
      )}
      {error && !loading && (
        <MessageBubble role="assistant">
          <div className="text-red-700 dark:text-red-400">{error}</div>
        </MessageBubble>
      )}
    </div>
  );
}

export default ChatMessages;
