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
  const date = timestamp ? new Date(timestamp) : new Date();
  const formattedDate = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);

  // 画像メッセージ用の表示処理
  const isImage = type === 'image' && typeof children === 'string' && children.startsWith('data:image/');
  
  // 画像表示サイズの管理
  const [imageExpanded, setImageExpanded] = useState(false);
  const handleImageClick = () => {
    setImageExpanded(!imageExpanded);
  };

  // テキスト部分のエスケープ
  const renderContent = () => {
    // 画像の場合
    if (isImage) {
      return (
        <div className="relative">
          <img 
            src={children as string} 
            alt={prompt || "チャートイメージ"} 
            className={cn(
              "rounded-md border border-border max-w-full",
              imageExpanded ? "w-auto max-h-[80vh]" : "w-60 sm:w-80 max-h-60"
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
    <div
      className={cn(
        "flex gap-3 w-full max-w-full",
        role === "user" ? "flex-row-reverse" : ""
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-center",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {avatar ? (
          typeof avatar === "string" ? (
            <Avatar className="h-5 w-5">
              <AvatarImage src={avatar} />
              <AvatarFallback>{role === "user" ? "U" : "AI"}</AvatarFallback>
            </Avatar>
          ) : (
            avatar
          )
        ) : (
          <span className="font-medium">
            {role === "user" ? "あなた" : "DeepTrader AI"}
          </span>
        )}
      </div>

      <div
        className={cn(
          "flex flex-col max-w-[90%] sm:max-w-[75%]",
          role === "user" ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "px-4 py-2 rounded-lg h-fit",
            role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
            typing && "animate-pulse"
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-full break-words text-pretty"
          >
            {renderContent()}
          </motion.div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {formattedDate}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
