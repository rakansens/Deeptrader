"use client";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import TypingIndicator from "./typing-indicator";
import { Copy, VolumeX, Volume2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useSettings } from "@/hooks/use-settings";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ChatRole } from "@/types";

export interface MessageBubbleProps {
  role: ChatRole;
  children: ReactNode;
  className?: string;
  /** アシスタントが入力中であることを示す */
  typing?: boolean;
  /** UNIXタイムスタンプ */
  timestamp?: number;
  /** アバター画像URLまたはアイコン要素 */
  avatar?: string | ReactNode;
  /** メッセージ種別 */
  type?: 'text' | 'image';
  /** 画像メッセージの説明 */
  prompt?: string;
}

export function MessageBubble({
  role,
  children,
  className,
  typing = false,
  timestamp,
  avatar,
  type = 'text',
  prompt,
}: MessageBubbleProps) {
  const { speechSynthesisEnabled } = useSettings();
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const handleCopy = () => {
    if (typeof children !== "string" || typing) return;
    try {
      void navigator.clipboard.writeText(children);
    } catch {
      // ignore clipboard errors
    }
  };
  
  const speakMessage = () => {
    if (typeof children !== "string" || typing) return;
    
    try {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      
      const utter = new SpeechSynthesisUtterance(children as string);
      utter.lang = "ja-JP";
      
      // イベントハンドラー
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      
      // 日本語の音声を優先的に選択
      // Chrome特有の問題対応: 音声リストが初回はemptyの場合がある
      if (window.speechSynthesis.getVoices().length === 0) {
        // Chrome向けの対応
        window.speechSynthesis.onvoiceschanged = function() {
          const voices = window.speechSynthesis.getVoices();
          const jaVoice = voices.find(v => v.lang.includes("ja-JP"));
          if (jaVoice) {
            utter.voice = jaVoice;
          }
          window.speechSynthesis.speak(utter);
        };
      } else {
        // 通常の処理
        const voices = window.speechSynthesis.getVoices();
        const jaVoice = voices.find(v => v.lang.includes("ja-JP"));
        if (jaVoice) {
          utter.voice = jaVoice;
        }
        window.speechSynthesis.speak(utter);
      }
    } catch (error) {
      console.error("メッセージ読み上げエラー:", error);
    }
  };
  
  // 読み上げ中にページを離れたときに停止する
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis?.cancel();
      }
    };
  }, [isSpeaking]);
  
  return (
    <div
      className={cn(
        "p-4 rounded-md space-y-1 animate-in fade-in-0",
        role === "user"
          ? "bg-primary/10 border-l-4 border-primary ml-4"
          : "bg-muted/50",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {avatar ? (
          typeof avatar === "string" ? (
            <Avatar className="h-5 w-5">
              <AvatarImage src={avatar} />
              <AvatarFallback>{role === "user" ? "U" : "AI"}</AvatarFallback>
            </Avatar>
          ) : (
            avatar
          )
        ) : null}
        <span className="font-medium">
          {role === "user" ? "あなた" : "DeepTrader AI"}
        </span>
        {timestamp !== undefined && (
          <span className="ml-auto">{formatDateTime(timestamp)}</span>
        )}
        
        <div className="flex items-center gap-1">
          {role === "assistant" && speechSynthesisEnabled && type === 'text' && typeof children === "string" && !typing && (
            <button
              type="button"
              aria-label={isSpeaking ? "読み上げを停止" : "メッセージを読み上げ"}
              onClick={speakMessage}
              className="p-1 hover:text-foreground"
              title={isSpeaking ? "読み上げを停止" : "メッセージを読み上げ"}
            >
              {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </button>
          )}
          
          {type === 'text' && typeof children === "string" && !typing && (
            <button
              type="button"
              aria-label="コピー"
              onClick={handleCopy}
              className="p-1 hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="text-sm whitespace-pre-wrap">
        {typing ? (
          <div className="flex items-center gap-2">
            <TypingIndicator />
            {children}
          </div>
        ) : type === 'image' && typeof children === 'string' ? (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={children} 
                alt={prompt ?? 'チャート画像'} 
                className="w-full max-h-[500px] object-contain rounded-md border border-border shadow-sm" 
                onClick={() => window.open(children, '_blank')}
                style={{ cursor: 'pointer' }}
              />
              <div className="absolute bottom-2 right-2 bg-background/80 text-xs px-2 py-1 rounded text-muted-foreground">
                クリックで拡大
              </div>
            </div>
            {prompt && <div className="text-sm bg-muted/30 p-2 rounded-md border-l-2 border-primary/50">{prompt}</div>}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
