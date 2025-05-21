"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { flushSync } from "react-dom";
import {
  ArrowUpIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Mic,
  MicOff,
  TrendingUp,
  ImagePlus,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MessageBubble from "./message-bubble";
import ConversationSidebar from "./conversation-sidebar";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { captureChart } from "@/lib/captureChart";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useSettings } from "@/hooks/use-settings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SettingsDialog from "@/components/SettingsDialog";
import ChatToolbar from "./chat-toolbar";
import ChatInput from "./chat-input";
import { useScreenshot } from "@/hooks/use-screenshot";

export default function Chat() {
  const {
    messages,
    input,
    setInput,
    loading,
    error,
    conversations,
    selectedId,
    selectConversation,
    newConversation,
    renameConversation,
    removeConversation,
    sidebarOpen,
    toggleSidebar,
    sendMessage,
    sendImageMessage,
  } = useChat();
  const { toast } = useToast();
  const listRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // 音声入力フックを使用
  const { isListening, startListening, stopListening, toggleListening } =
    useVoiceInput({
      onResult: (text) => {
        setInput(text);
      },
      lang: "ja-JP",
    });

  const { captureScreenshot } = useScreenshot({
    onCapture: async (url: string) => {
      await sendImageMessage(url, "このチャートを分析してください");
    },
  });

  // メッセージ送信の共通ロジック
  const handleSendMessage = () => {
    stopListening(); // 音声入力を停止

    if (!input.trim()) return;

    const text = input; // 現在の入力を保存

    // 入力欄をクリア（同期的に実行）
    flushSync(() => {
      setInput("");
    });

    // メッセージを送信（非同期処理を次のイベントループに遅延させる）
    isSendingRef.current = true;
    setTimeout(() => {
      sendMessage(text).finally(() => {
        isSendingRef.current = false;
      });
    }, 0);
  };

  // 画像ファイル選択時の処理
  const handleFileChange = (file: File) => {
    if (!file) return;

    const text = input;

    flushSync(() => {
      setInput("");
    });

    setUploading(true);
    sendMessage(text, file)
      .catch((err) => {
        console.error("画像送信エラー", err);
      })
      .finally(() => {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
  };

  const {
    voiceInputEnabled,
    speechSynthesisEnabled,
    refreshSettings,
    userAvatar,
    assistantAvatar,
  } = useSettings();

  const exportConversation = (format: "json" | "txt") => {
    const data =
      format === "json"
        ? JSON.stringify(messages, null, 2)
        : messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    const blob = new Blob([data], {
      type: format === "json" ? "application/json" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation_${selectedId}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 新しいメッセージや読み込み状態の変化でスクロールを最下部に移動
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // アシスタントのメッセージを読み上げ - 自動読み上げを無効化
  useEffect(() => {
    // この関数では何もしないように変更
    // 読み上げはメッセージバブルの個別ボタンから行うため
    // 以下の処理を無効化
  }, [messages, loading, speechSynthesisEnabled]); // 依存配列はそのまま残す

  // エラーが発生した場合にトースト表示
  useEffect(() => {
    if (error) {
      toast({ title: "エラー", description: error });
    }
  }, [error, toast]);

  // 音声入力設定の変更を監視
  useEffect(() => {
    // 設定変更の監視は必要に応じて実装
  }, [voiceInputEnabled]);

  // 設定変更を監視して定期的に最新の設定を読み込む
  useEffect(() => {
    // コンポーネントのマウント時に一度読み込む
    refreshSettings();

    // 3秒ごとに設定を更新
    const interval = setInterval(() => {
      refreshSettings();
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 依存配列を空にして、マウント時のみ実行されるようにする

  // キーボードショートカットを登録
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // 入力中はショートカットを無効化
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        captureScreenshot();
      }

      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }

      if (e.ctrlKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [captureScreenshot, toggleSidebar, toggleListening]);

  return (
    <div className="flex h-full relative">
      <div
        id="conversationSidebar"
        aria-hidden={!sidebarOpen}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          sidebarOpen ? "w-full md:w-56" : "w-0",
        )}
      >
        <ConversationSidebar
          conversations={conversations}
          selectedId={selectedId}
          onSelect={selectConversation}
          onRename={renameConversation}
          onRemove={removeConversation}
          className={cn(
            "absolute inset-0 w-full md:w-56 md:relative md:block border-r bg-background flex flex-col transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
          footer={
            <Button
              variant="outline"
              className="w-full"
              onClick={newConversation}
            >
              新しいチャット
            </Button>
          }
        />
      </div>
      <div className="flex-1 flex flex-col h-full p-4 relative">
        <ChatToolbar
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          exportConversation={exportConversation}
        />
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2 mt-2"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">DeepTrader AIへようこそ！</p>
                <p className="mb-1">あなたのパーソナル取引アシスタントです。</p>
                <p className="mb-4">下のように、市場分析、チャート操作、一般的な質問など、何でも聞いてみてくださいね。</p>
              </div>
              <div className="flex flex-col gap-2 mx-auto w-full max-w-sm">
                {[
                  "今日のビットコインはどう？",
                  "イーサリアムの価格を教えて",
                  "RSIインジケーターを表示して",
                  "移動平均線（MA）を非表示にして",
                  "このチャート、どう思う？ (まずチャート画像を送信してください)",
                  "初心者向けの投資戦略を教えて",
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
        <ChatInput
          input={input}
          setInput={setInput}
          loading={loading}
          onSendMessage={handleSendMessage}
          onScreenshot={captureScreenshot}
          onUploadImage={handleFileChange}
          voiceInputEnabled={voiceInputEnabled}
          isListening={isListening}
          toggleListening={toggleListening}
        />
      </div>
    </div>
  );
}
