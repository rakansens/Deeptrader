"use client";

// Updated to handle Mastra streaming responses properly

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";
import { logger } from "@/lib/logger";
import { Message } from "@/types";

// Mastraストリーミングレスポンスの型定義
interface MastraStreamPart {
  type: "text-delta" | "step-start" | "step-finish" | "finish";
  textDelta?: string;
  finishReason?: string;
  usage?: any;
}

interface MastraStreamResponse {
  part: MastraStreamPart;
}

// チャットの受信メッセージを処理するコンポーネント
function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { voiceInputEnabled, userAvatar, assistantAvatar } = useSettings();

  // チャット状態とロジック
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 音声入力状態
  const [isListening, setIsListening] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");

  // Mastraストリーミングレスポンスを処理する関数
  const processMastraStream = async (response: Response): Promise<string> => {
    if (!response.body) {
      throw new Error("レスポンスボディがありません");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // チャンクをデコードしてバッファに追加
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 改行で分割して個々のJSONオブジェクトを処理
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 最後の不完全な行は次回に持ち越し
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed: MastraStreamResponse = JSON.parse(line);
              
              if (parsed.part?.type === "text-delta" && parsed.part.textDelta) {
                fullText += parsed.part.textDelta;
                
                // リアルタイムでメッセージを更新
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  
                  if (lastMessage?.role === "assistant" && lastMessage.id === "streaming") {
                    lastMessage.content = fullText;
                  } else {
                    // 新しいアシスタントメッセージを追加
                    newMessages.push({
                      id: "streaming",
                      role: "assistant",
                      content: fullText,
                      timestamp: Date.now(),
                      type: "text"
                    });
                  }
                  
                  return newMessages;
                });
              }
              
              // ストリーミング完了の処理
              if (parsed.part?.type === "finish" || parsed.part?.type === "step-finish") {
                logger.info("Mastraストリーミング完了", { usage: parsed.part.usage });
              }
              
            } catch (parseError) {
              logger.warn("JSONパース失敗:", line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullText;
  };

  // メッセージ送信処理
  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now(),
      type: "text"
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Mastra API呼び出し
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: currentInput }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // ストリーミングレスポンスを処理
      const finalText = await processMastraStream(response);
      
      // ストリーミング完了後、一意IDで最終メッセージを更新
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        
        if (lastMessage?.id === "streaming") {
          lastMessage.id = Date.now().toString();
          lastMessage.content = finalText;
        }
        
        return newMessages;
      });

    } catch (err) {
      logger.error("チャットAPI呼び出しエラー:", err);
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました";
      setError(errorMessage);
      
      // エラーメッセージを表示
      const errorAIMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `申し訳ありません。エラーが発生しました: ${errorMessage}`,
        timestamp: Date.now(),
        type: "text"
      };
      
      setMessages(prev => [...prev, errorAIMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 画像アップロード処理（仮実装）
  const handleImageUpload = async (file: File) => {
    // TODO: 実際の画像アップロード処理を実装
    console.log("画像アップロード:", file.name);
  };
  
  // スクリーンショット処理（仮実装）
  const takeScreenshot = () => {
    // TODO: 実際のスクリーンショット処理を実装
    console.log("スクリーンショット撮影");
  };
  
  // 音声入力の切り替え
  const toggleListening = () => {
    setIsListening(!isListening);
    if (isListening) {
      // 停止処理
      setRecordingTime(0);
    } else {
      // 開始処理
      // TODO: 実際の音声認識を実装
    }
  };
  
  // 音声認識結果をリセット
  const resetTranscript = () => {
    setTranscript("");
  };

  // メッセージ受信時にスクロールを最下部に移動
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 音声認識結果を入力欄に反映
  useEffect(() => {
    if (transcript) {
      setInput(prev => prev + " " + transcript);
      resetTranscript();
    }
  }, [transcript]);

  const handleBack = () => {
    router.push("/");
  };

  // ページコンポーネントでメッセージの送信ロジックを管理
  const sendMessage = (text: string) => {
    setInput(text);
    // 次のイベントループで実行して、inputの更新を確実に反映
    setTimeout(() => handleSubmit(), 0);
  };

  return (
    <main className="flex flex-col min-h-screen p-3 sm:p-4 lg:px-6">
      {/* ヘッダー領域 */}
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="rounded-md dark:bg-muted/80 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">戻る</span>
        </Button>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>生成中...</span>
            </div>
          )}
          <SettingsDropdown />
        </div>
      </div>

      {/* メッセージ表示領域 */}
      <div className="flex-1 overflow-hidden relative rounded-md border bg-background shadow-sm">
        <div
          ref={messagesContainerRef}
          className="h-full overflow-y-auto pb-[100px]"
        >
          <ChatMessages 
            messages={messages}
            loading={isLoading}
            error={error}
            listRef={messagesContainerRef}
            userAvatar={userAvatar}
            assistantAvatar={assistantAvatar}
            setInput={setInput}
            sendMessage={sendMessage}
          />
        </div>

        {/* 入力領域 */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent py-2 px-4"
          )}
        >
          <ChatInput
            input={input}
            setInput={setInput}
            loading={isLoading}
            onSendMessage={handleSubmit}
            onScreenshot={takeScreenshot}
            onUploadImage={handleImageUpload}
            voiceInputEnabled={voiceInputEnabled}
            isListening={isListening}
            toggleListening={toggleListening}
            recordingTime={recordingTime}
          />
        </div>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <ChatPageContent />
    </Suspense>
  );
} 