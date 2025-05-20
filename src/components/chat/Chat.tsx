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
  const spokenRef = useRef<string | null>(null);
  const isSendingRef = useRef(false);
  
  // 音声入力フックを使用
  const { isListening, startListening, stopListening, toggleListening } = useVoiceInput({
    onResult: (text) => {
      setInput(text);
    },
    lang: "ja-JP"
  });

  // メッセージ送信の共通ロジック
  const handleSendMessage = () => {
    stopListening(); // 音声入力を停止
    
    if (!input.trim()) return;
    
    const text = input;  // 現在の入力を保存
    
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

  const {
    voiceInputEnabled,
    speechSynthesisEnabled,
    refreshSettings,
  } = useSettings();

  const exportConversation = (format: 'json' | 'txt') => {
    const data =
      format === 'json'
        ? JSON.stringify(messages, null, 2)
        : messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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

  return (
    <div className="flex h-full relative">
      <div
        id="conversationSidebar"
        aria-hidden={!sidebarOpen}
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          sidebarOpen ? 'w-full md:w-56' : 'w-0'
        )}
      >
        <ConversationSidebar
          conversations={conversations}
          selectedId={selectedId}
          onSelect={selectConversation}
          onRename={renameConversation}
          onRemove={removeConversation}
          className={cn(
            'absolute inset-0 w-full md:w-56 md:relative md:block border-r bg-background flex flex-col transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          footer={
            <Button variant="outline" className="w-full" onClick={newConversation}>
              新しいチャット
            </Button>
          }
        />
      </div>
      <div className="flex-1 flex flex-col h-full p-4 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={sidebarOpen ? "スレッドを非表示" : "スレッドを表示"}
              aria-expanded={sidebarOpen}
              aria-controls="conversationSidebar"
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-foreground"
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center space-x-1">
            <SettingsDialog />
            
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="会話をエクスポート"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>会話をエクスポート</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => exportConversation('json')}>
                  JSONでダウンロード
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportConversation('txt')}>
                  テキストでダウンロード
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto space-y-4 pr-2 mt-2" aria-live="polite">
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
              <MessageBubble
                key={idx}
                role={m.role}
                timestamp={m.timestamp}
                avatar={m.role === "user" ? "U" : "AI"}
                type={m.type}
                prompt={m.prompt}
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
        <div className="mt-4 relative">
          <div className="flex justify-end mb-2 space-x-2">
            <Button
              onClick={async () => {
                try {
                  // チャートキャプチャを実行
                  toast({ 
                    title: "📸 チャートキャプチャ中", 
                    description: "チャートの画像を取得しています...", 
                    duration: 3000 
                  });
                  
                  const url = await captureChart();
                  
                  if (url) {
                    // 画像データのプレビュー（デバッグ用）
                    if (process.env.NODE_ENV !== 'production') {
                      const debugImg = document.createElement('img');
                      debugImg.src = url;
                      debugImg.style.position = 'fixed';
                      debugImg.style.top = '0';
                      debugImg.style.right = '0';
                      debugImg.style.width = '200px';
                      debugImg.style.zIndex = '9999';
                      debugImg.style.border = '2px solid red';
                      debugImg.style.background = '#fff';
                      debugImg.style.opacity = '0.9';
                      debugImg.addEventListener('click', () => document.body.removeChild(debugImg));
                      document.body.appendChild(debugImg);
                      
                      // 5秒後に自動で消える
                      setTimeout(() => {
                        if (document.body.contains(debugImg)) {
                          document.body.removeChild(debugImg);
                        }
                      }, 5000);
                    }
                    
                    // AIへ送信
                    await sendImageMessage(url);
                    
                    toast({ 
                      title: "✅ チャート送信完了", 
                      description: "チャートデータをAIに送信しました",
                      duration: 3000
                    });
                  } else {
                    toast({ 
                      title: "❌ エラー", 
                      description: "チャートのキャプチャに失敗しました", 
                      variant: "destructive" 
                    });
                  }
                } catch (err) {
                  console.error('スクリーンショット送信エラー:', err);
                  toast({ 
                    title: "❌ エラー", 
                    description: "スクリーンショットの送信に失敗しました", 
                    variant: "destructive" 
                  });
                }
              }}
              disabled={loading}
              size="sm"
              variant="outline"
              className="relative flex items-center justify-center h-9 w-9 rounded-full border border-input text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300 ease-in-out overflow-hidden group hover:w-auto hover:pl-3 hover:pr-4"
            >
              <TrendingUp className="h-5 w-5 min-w-5 transition-transform group-hover:scale-110 duration-200 text-inherit" />
              <span className="max-w-0 whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out text-sm font-medium">チャートを送信</span>
            </Button>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            aria-label="メッセージ入力"
            className={cn(
              "min-h-[80px] resize-none pr-12",
              "focus-visible:ring-primary",
              voiceInputEnabled ? "pl-12" : "pl-4" // 音声入力ボタンの有無でパディングを調整
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          {voiceInputEnabled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    onClick={toggleListening}
                    variant={isListening ? "default" : "outline"}
                    size="icon"
                    aria-label={isListening ? "音声入力を停止" : "音声入力を開始"}
                    className={cn(
                      "absolute left-2 bottom-2",
                      isListening && "bg-red-500 hover:bg-red-600 text-white"
                    )}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isListening 
                      ? "音声入力中（クリックで停止）" 
                      : "音声入力を開始"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            size="icon"
            aria-label="送信"
            className="absolute right-2 bottom-2"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
