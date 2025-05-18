"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpIcon, LoaderCircle } from "lucide-react";
import MessageBubble from "./message-bubble";
import ConversationSidebar, { type Conversation } from "./conversation-sidebar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversations: Conversation[] = [
    { id: "current", title: "現在の会話" },
  ];
  const [selected, setSelected] = useState<string>("current");

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        // レスポンスがJSONでない場合にエラーをキャッチ
        let errorMessage = "";
        try {
          const data = await res.json();
          errorMessage = data.error || `APIエラー: ${res.status}`;
        } catch (e) {
          errorMessage = `APIエラー: ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        throw new Error("APIからの応答が無効です");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "メッセージ送信中にエラーが発生しました";
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `すみません、エラーが発生しました: ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <ConversationSidebar
        conversations={conversations}
        selectedId={selected}
        onSelect={setSelected}
        className="hidden md:block"
      />
      <div className="flex-1 flex flex-col h-full p-4">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <p className="mb-4">質問や指示を入力してください</p>
              <div className="flex flex-col gap-2 mx-auto w-full max-w-sm">
                {[
                  "ビットコインの現在のトレンドは？",
                  "RSIが示す売買シグナルは？",
                  "ボリンジャーバンドの使い方を教えて",
                  "現在の市場リスクを分析して",
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    className="text-sm h-auto py-2 px-3 justify-start text-left w-full"
                    onClick={() => {
                      setInput(suggestion);
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <MessageBubble key={idx} role={m.role}>
                {m.content}
              </MessageBubble>
            ))
          )}
          {loading && (
            <MessageBubble role="assistant" typing>
              <div className="flex items-center">
                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">考え中...</span>
              </div>
            </MessageBubble>
          )}
          {error && !loading && (
            <MessageBubble role="assistant">
              <div className="text-red-700 dark:text-red-400">{error}</div>
            </MessageBubble>
          )}
        </div>
        <div className="mt-4 relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="min-h-[80px] resize-none pr-12 focus-visible:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="icon"
            className="absolute right-2 bottom-2"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
