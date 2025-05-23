"use client";

import { Button } from "@/components/ui/button";
import { flushSync } from "react-dom";

import ConversationSidebar from "./conversation-sidebar";
import ChatMessages from "./chat-messages";
import { useChat } from "@/hooks/chat/use-chat";
import { cn } from "@/lib/utils";
import { captureChart } from "@/lib/chart";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";
import { useVoiceInput } from "@/hooks/chat/use-voice-input";
import { useSettings } from "@/hooks/use-settings";
import { useChatHotkeys } from "@/hooks/chat/use-chat-hotkeys";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ChatToolbar from "./chat-toolbar";
import ChatInput from "./chat-input";
import { useScreenshot } from "@/hooks/use-screenshot";
import type { SymbolValue, Timeframe } from "@/constants/chart";

interface ChatProps {
  symbol: SymbolValue;
  timeframe: Timeframe;
}

export default function Chat({ symbol, timeframe }: ChatProps) {
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
  const {
    isListening,
    startListening,
    stopListening,
    toggleListening,
    recordingTime,
  } = useVoiceInput({
    onResult: (text) => {
      setInput(text);
    },
    lang: "ja-JP",
  });

  const { captureScreenshot } = useScreenshot({
    onCapture: async (url: string) => {
      let analysis = "";
      try {
        // チャート分析APIを呼び出し
        const res = await fetch("/api/chart-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            symbol, 
            timeframe
            // タイムスタンプパラメータは削除（APIがサポートしていない可能性あり）
          }),
        });
        
        // APIレスポンスを処理
        const data = await res.json();
        
        if (res.ok && data) {
          // 正常なレスポンスの場合はJSONを文字列化
          analysis = JSON.stringify(data);
        } else {
          // APIエラーの場合はログに記録
          logger.error("Chart analysis API error", data);
          // 最小限の情報を含める
          analysis = JSON.stringify({
            symbol,
            timeframe,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        // ネットワークエラーなどの例外処理
        logger.error("Chart analysis request failed", err);
        // エラー時は最低限の情報を送信
        analysis = JSON.stringify({
          symbol,
          timeframe,
          timestamp: new Date().toISOString()
        });
      }
      
      // プロンプトを作成してチャートイメージとともに送信
      const prompt = `このチャートを分析してください\n${analysis}`;
      
      try {
        // チャート画像と分析指示を送信
        await sendImageMessage(url, prompt);
      } catch (sendErr) {
        logger.error("Failed to send chart image", sendErr);
        toast({
          title: "❌ 送信エラー", 
          description: "チャート画像の送信に失敗しました",
          variant: "destructive",
        });
      }
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

  // サンプルメッセージを直接送信するための関数
  const suggestMessage = (text: string) => {
    if (!text.trim()) return;
    
    // 入力欄にテキストをセット（UIに反映するため）
    setInput(text);
    
    // すぐにメッセージを送信
    isSendingRef.current = true;
    setTimeout(() => {
      // 入力欄をクリア
      flushSync(() => {
        setInput("");
      });
      
      // メッセージを送信
      sendMessage(text).finally(() => {
        isSendingRef.current = false;
      });
    }, 100);
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
        logger.error("画像送信エラー", err);
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

  // 設定変更を監視 - localStorageの変更イベントで更新
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // キーボードショートカットを登録
  useChatHotkeys({
    onScreenshot: captureScreenshot,
    onToggleSidebar: toggleSidebar,
    onToggleVoice: toggleListening,
  });

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
          totalConversations={conversations.length}
          currentConversationIndex={conversations.findIndex(c => c.id === selectedId)}
        />
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 max-w-full overflow-auto">
            <ChatMessages
              messages={messages}
              loading={loading}
              error={error}
              listRef={listRef}
              userAvatar={userAvatar}
              assistantAvatar={assistantAvatar}
              setInput={setInput}
              sendMessage={suggestMessage}
            />
          </div>
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
          recordingTime={recordingTime}
        />
      </div>
    </div>
  );
}
