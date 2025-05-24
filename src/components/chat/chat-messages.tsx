"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import MessageBubble from "./message-bubble";
import type { Message } from "@/types";

// アイコンをインポート
import { 
  TrendingUp, 
  DollarSign, 
  BarChart2, 
  LineChart, 
  HelpCircle, 
  Image 
} from "lucide-react";

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
  listRef: React.RefObject<HTMLDivElement>;
  userAvatar?: string;
  assistantAvatar?: string;
  setInput: (value: string) => void;
  sendMessage: (text: string) => void;
  selectedId?: string;
}

// 提案をカテゴリー別に整理
const suggestionGroups = [
  {
    category: "市場情報",
    gradient: "from-blue-500 to-cyan-400",
    items: [
      { text: "今日のビットコインはどう？", icon: <TrendingUp className="mr-2 h-4 w-4" /> },
      { text: "イーサリアムの価格を教えて", icon: <DollarSign className="mr-2 h-4 w-4" /> },
    ]
  },
  {
    category: "チャート操作",
    gradient: "from-indigo-500 to-purple-400",
    items: [
      { text: "RSIインジケーターを表示して", icon: <BarChart2 className="mr-2 h-4 w-4" /> },
      { text: "移動平均線（MA）を非表示にして", icon: <LineChart className="mr-2 h-4 w-4" /> },
      { text: "このチャート、どう思う？ (まずチャート画像を送信してください)", icon: <Image className="mr-2 h-4 w-4" /> },
    ]
  },
  {
    category: "投資アドバイス",
    gradient: "from-amber-500 to-orange-400",
    items: [
      { text: "初心者向けの投資戦略を教えて", icon: <HelpCircle className="mr-2 h-4 w-4" /> },
    ]
  }
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
  selectedId,
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
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="text-center mb-8 max-w-md animate-fadeIn">
            <p className="text-2xl font-semibold mb-4 bg-gradient-to-r from-primary to-accentBlue bg-clip-text text-transparent animate-pulse">
              DeepTrader AIへようこそ！
            </p>
            <p className="mb-3 text-base text-foreground animate-slideUpFade delay-300">
              あなたのパーソナル取引アシスタントです。市場分析、チャート操作、投資アドバイスなど、何でもお気軽にお尋ねください。
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mx-auto w-full max-w-2xl px-4 animate-fadeIn opacity-0 animation-delay-500">
            {suggestionGroups.map((group, idx) => (
              <div 
                key={group.category} 
                className={`flex flex-col gap-2 bg-card/60 backdrop-blur-sm p-4 rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 animate-slideUpFade animation-delay-${(idx + 1) * 200}`}
                style={{animationDelay: `${(idx + 1) * 200}ms`}}
              >
                <h3 className={`text-sm font-medium bg-gradient-to-r ${group.gradient} bg-clip-text text-transparent mb-2`}>
                  {group.category}
                </h3>
                {group.items.map((item) => (
                  <Button
                    key={item.text}
                    variant="ghost"
                    size="sm"
                    className="text-sm justify-start text-left w-full font-normal hover:bg-accent/50 hover:translate-x-0.5 transition-all duration-200"
                    onClick={() => sendMessage(item.text)}
                  >
                    {item.icon}
                    <span className="truncate">{item.text}</span>
                  </Button>
                ))}
              </div>
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
            message={m}
            conversationId={selectedId}
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
