// src/components/chat/Chat.tsx
// チャットUIコンポーネント - SRP準拠のプレゼンテーション層
// UI イベントハンドリング・入力状態クリア・ユーザー操作のみを担当
// ビジネスロジック層(use-chat.ts)との責任分離により、設計をクリーンに整理

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
    navigateHistory,
    resetHistoryNavigation,
    messageHistory,
  } = useChat();
  const { toast } = useToast();
  const listRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null); // テキストエリア直接操作用

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
  const handleSendMessage = async () => {
    stopListening(); // 音声入力を停止

    const currentInput = input.trim();
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 送信前 - input:', input, 'currentInput:', currentInput, 'isSending:', isSendingRef.current);
    }
    
    if (!currentInput) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ 入力が空のため送信キャンセル');
      }
      return;
    }
    
    if (isSendingRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ 重複送信防止：既に送信中');
      }
      toast({
        title: "⏳ 送信中です",
        description: "前のメッセージの送信が完了するまでお待ちください",
        variant: "default",
      });
      return;
    }

    try {
      isSendingRef.current = true;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 入力クリア前 - input:', input, 'textAreaRef:', !!textAreaRef.current);
      }
      
      // DOM を直接クリア（確実性を高める）
      if (textAreaRef.current) {
        textAreaRef.current.value = "";
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 DOM直接クリア完了');
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ textAreaRef.current が null');
      }
      
      // flushSyncで同期的に入力欄をクリア
      flushSync(() => {
        setInput(""); 
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 入力クリア後 - input:', input);
      }
      await sendMessage(currentInput); // 値を明確に渡す
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 メッセージ送信完了');
      }
    } catch (error) {
      console.error('💥 メッセージ送信エラー:', error);
      logger.error("メッセージ送信エラー:", error);
      toast({
        title: "❌ 送信エラー",
        description: "メッセージの送信に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      isSendingRef.current = false;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔓 送信ロック解除');
      }
    }
  };

  // サンプルメッセージを直接送信するための関数
  const suggestMessage = async (text: string) => {
    if (!text.trim()) return;
    if (isSendingRef.current) return; // 重複送信防止
    
    try {
      isSendingRef.current = true;
      await sendMessage(text);
    } catch (error) {
      logger.error("サジェストメッセージ送信エラー:", error);
    } finally {
      isSendingRef.current = false;
    }
  };

  // 画像ファイル選択時の処理
  const handleFileChange = async (file: File) => {
    if (!file) return;
    if (isSendingRef.current) return; // 重複送信防止

    try {
      setUploading(true);
      isSendingRef.current = true;
      const inputText = input.trim() || "画像をアップロードしました"; // デフォルトテキスト
      // flushSyncで同期的に入力欄をクリア
      flushSync(() => {
        setInput("");
      });
      await sendMessage(inputText, file);
    } catch (err) {
      logger.error("画像送信エラー", err);
    } finally {
      setUploading(false);
      isSendingRef.current = false;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

  // デバッグ用：input状態の変更を監視
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 input状態変更:', input);
    }
  }, [input]);

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
              selectedId={selectedId}
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
          textAreaRef={textAreaRef}
          navigateHistory={navigateHistory}
          resetHistoryNavigation={resetHistoryNavigation}
          messageHistory={messageHistory}
        />
      </div>
    </div>
  );
}
