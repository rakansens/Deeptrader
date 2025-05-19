"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowUpIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Mic,
  MicOff,
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
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";
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
  } = useChat();
  const { toast } = useToast();
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const spokenRef = useRef<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const {
    voiceInputEnabled,
    speechSynthesisEnabled,
  } = useSettings();

  const startVoiceInput = () => {
    if (!voiceInputEnabled) return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    
    const rec: any = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.lang = "ja-JP";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(text);
      setIsListening(false);
    };
    rec.onend = () => {
      setIsListening(false);
    };
    rec.onerror = () => {
      setIsListening(false);
    };
    rec.start();
    setIsListening(true);
  };

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

  // アシスタントのメッセージを読み上げ
  useEffect(() => {
    if (!speechSynthesisEnabled || loading) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || spokenRef.current === last.id) {
      return;
    }
    
    console.log("音声読み上げを開始:", last.content);
    
    try {
      // Speech Synthesis APIのサポート確認
      if (!window.speechSynthesis) {
        console.error("お使いのブラウザはSpeech Synthesis APIをサポートしていません");
        return;
      }
      
      // 既存の音声を停止
      window.speechSynthesis.cancel();
      
      const utter = new SpeechSynthesisUtterance(last.content);
      
      // 日本語設定
      utter.lang = "ja-JP";
      utter.rate = 1.0; // 速度 (0.1-10)
      utter.pitch = 1.0; // 音程 (0-2)
      utter.volume = 1.0; // 音量 (0-1)
      
      // イベントハンドラー
      utter.onstart = () => console.log("音声読み上げ開始");
      utter.onend = () => console.log("音声読み上げ終了");
      utter.onerror = (e) => console.error("音声読み上げエラー:", e);
      
      // 利用可能な音声を取得 (初回のみ)
      if (window.speechSynthesis.getVoices().length === 0) {
        console.log("音声リストを読み込み中...");
        // Chromeの場合、非同期で音声リストを取得するため、
        // voiceschangedイベントを利用
        window.speechSynthesis.onvoiceschanged = () => {
          const voices = window.speechSynthesis.getVoices();
          console.log("利用可能な音声:", voices.map(v => `${v.name} (${v.lang})`));
          
          // 日本語の音声を優先的に選択
          const jaVoice = voices.find(v => v.lang.includes("ja-JP"));
          if (jaVoice) {
            console.log("日本語音声を選択:", jaVoice.name);
            utter.voice = jaVoice;
          }
          
          spokenRef.current = last.id;
          window.speechSynthesis.speak(utter);
        };
      } else {
        // 音声リストが既に利用可能な場合
        const voices = window.speechSynthesis.getVoices();
        
        // 日本語の音声を優先的に選択
        const jaVoice = voices.find(v => v.lang.includes("ja-JP"));
        if (jaVoice) {
          console.log("日本語音声を選択:", jaVoice.name);
          utter.voice = jaVoice;
        }
        
        spokenRef.current = last.id;
        window.speechSynthesis.speak(utter);
      }
    } catch (error) {
      console.error("音声読み上げ実行エラー:", error);
    }
  }, [messages, loading, speechSynthesisEnabled]);

  // エラーが発生した場合にトースト表示
  useEffect(() => {
    if (error) {
      toast({ title: "エラー", description: error });
    }
  }, [error, toast]);

  // デバッグ情報をコンソールに出力
  useEffect(() => {
    console.log("音声入力設定:", voiceInputEnabled);
    console.log("LocalStorage voiceInputEnabled:", localStorage.getItem("voiceInputEnabled"));
  }, [voiceInputEnabled]);

  return (
    <div className="flex h-full relative">
      <div
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
        <div ref={listRef} className="flex-1 overflow-y-auto space-y-4 pr-2 mt-2">
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
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className={cn(
              "min-h-[80px] resize-none pr-12",
              "focus-visible:ring-primary",
              voiceInputEnabled ? "pl-12" : "pl-4" // 音声入力ボタンの有無でパディングを調整
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          
          {voiceInputEnabled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    onClick={startVoiceInput}
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
            onClick={sendMessage}
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
