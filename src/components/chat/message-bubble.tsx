"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useState } from "react";
import type { ReactNode } from "react";
import type { ChatRole } from "@/types";
import { useSettings } from "@/hooks/use-settings";
import { speakText, stopSpeech } from "@/lib/speech-utils";
import { Volume2, VolumeX } from "lucide-react";
import TypingIndicator from "./typing-indicator";

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
  /** Supabaseにアップロードした画像のURL */
  imageUrl?: string;
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
  imageUrl,
}: MessageBubbleProps) {
  const date = timestamp ? new Date(timestamp) : new Date();
  const formattedDate = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);

  // 読み上げ状態管理
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { speechSynthesisEnabled } = useSettings();

  // 画像メッセージ用の表示処理
  const isImage =
    type === 'image' &&
    ((typeof children === 'string' && children.startsWith('data:image/')) || !!imageUrl);
  
  // 画像表示サイズの管理
  const [imageExpanded, setImageExpanded] = useState(false);
  const handleImageClick = () => {
    setImageExpanded(!imageExpanded);
  };

  // テキスト読み上げ処理
  const handleSpeakMessage = () => {
    if (typeof children !== 'string' || isImage) return;
    
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }
    
    const utterance = speakText(children);
    setIsSpeaking(true);
    
    utterance?.addEventListener('end', () => {
      setIsSpeaking(false);
    });
    
    utterance?.addEventListener('error', () => {
      setIsSpeaking(false);
    });
  };

  // テキスト部分のエスケープ
  const renderContent = () => {
    // 画像の場合
    if (isImage) {
      const src = imageUrl || (typeof children === 'string' ? children : '');
      return (
        <div className="relative">
          <img
            src={src}
            alt={prompt || "チャートイメージ"}
            className={cn(
              "rounded-md border border-border max-w-full",
              imageExpanded ? "w-auto max-h-[80vh]" : "w-48 sm:w-64 max-h-48 object-cover"
            )}
            onClick={handleImageClick}
            style={{ cursor: 'pointer' }}
          />
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
            <span>{prompt || "チャートイメージ"}</span>
            <button 
              onClick={handleImageClick}
              className="text-xs text-primary hover:underline"
            >
              {imageExpanded ? "縮小" : "クリックで拡大"}
            </button>
          </div>
        </div>
      );
    }
    
    // テキストの場合
    if (typeof children === 'string') {
      // 改行をbrタグに変換
      const lines = children.split('\n');
      return lines.map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ));
    }
    
    // その他の場合はそのまま返す
    return children;
  };
  
  return (
    <motion.div
      data-testid="message-bubble"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3 w-full max-w-full motion-safe:transition-opacity motion-safe:transition-transform",
        role === "user" ? "flex-row-reverse" : "",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {typeof avatar === "string" ? (
          <Avatar className="h-5 w-5">
            {avatar && <AvatarImage src={avatar} />}
            <AvatarFallback>{role === "user" ? "U" : "AI"}</AvatarFallback>
          </Avatar>
        ) : avatar ? (
          avatar
        ) : (
          <Avatar className="h-5 w-5">
            <AvatarFallback>{role === "user" ? "U" : "AI"}</AvatarFallback>
          </Avatar>
        )}
        <span className="font-medium">
          {role === "user" ? "あなた" : "DeepTrader AI"}
        </span>
      </div>

      <div
        className={cn(
          "flex flex-col max-w-[90%] sm:max-w-[75%] md:max-w-[65%]",
          role === "user" ? "items-end" : "items-start",
          !isImage && "group"
        )}
      >
        <div className={cn("relative", isImage ? "" : "")}>
          <div
            className={cn(
              // 画像メッセージは背景・余白を除去してネイティブな見た目に
              isImage ? "p-0" : "px-4 py-2",
              !isImage &&
                (role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"),
              "rounded-lg h-fit",
              typing && "motion-safe:animate-pulse"
            )}
          >
            <div className="max-w-full break-words text-pretty">
              {typing ? <TypingIndicator /> : renderContent()}
            </div>
          </div>
          
        </div>
        
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
          {formattedDate}
          
          {/* 読み上げボタン - アシスタントメッセージかつテキストの場合のみ表示 */}
          {speechSynthesisEnabled && role === "assistant" && !isImage && !typing && typeof children === 'string' && (
            <button
              onClick={handleSpeakMessage}
              className={cn(
                "p-1 rounded ml-auto",
                "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                isSpeaking 
                  ? "opacity-100" // 読み上げ中は常に表示
                  : "opacity-0 group-hover:opacity-100", // 読み上げ中でない場合はホバー時のみ表示
                "transition-opacity",
                "flex items-center text-xs gap-1"
              )}
              aria-label={isSpeaking ? "読み上げを停止" : "メッセージを読み上げ"}
              title={isSpeaking ? "読み上げを停止" : "メッセージを読み上げ"}
            >
              {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              <span>{isSpeaking ? "停止" : "読み上げ"}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default MessageBubble;
