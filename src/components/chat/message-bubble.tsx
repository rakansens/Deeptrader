"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { ChatRole } from "@/types";
import { useSettings } from "@/hooks/use-settings";
import { speakText, stopSpeech } from "@/lib/speech-utils";
import { Volume2, VolumeX, Copy as CopyIcon, CheckCircle, Maximize2, Minimize2, Bookmark } from "lucide-react";
import TypingIndicator from "./typing-indicator";
import { Message } from "../../types/chat";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { containsMarkdown, parseMarkdownSafe } from "../../lib/markdown";
import { useBookmarks } from "../../hooks/use-bookmarks";
import { DEFAULT_BOOKMARK_CATEGORIES } from "../../types/bookmark";

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
  /** メッセージオブジェクト（ブックマーク用） */
  message?: Message;
  /** 会話ID（ブックマーク用） */
  conversationId?: string;
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
  message,
  conversationId,
}: MessageBubbleProps) {
  const date = timestamp ? new Date(timestamp) : new Date();
  const formattedDate = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);

  // 読み上げ状態管理
  const [isSpeaking, setIsSpeaking] = useState(false);
  // コピー状態管理
  const [isCopied, setIsCopied] = useState(false);
  const { speechSynthesisEnabled, userName, assistantName } = useSettings();

  // ブックマーク機能
  const { isBookmarked, addBookmark, removeBookmark, getBookmarkByMessageId, categories } = useBookmarks();
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // ブックマーク状態をチェック
  const messageIsBookmarked = message ? isBookmarked(message.id) : false;

  // ブックマーク切り替え処理
  const handleToggleBookmark = async () => {
    if (!message || !conversationId) return;
    
    setBookmarkLoading(true);
    try {
      if (messageIsBookmarked) {
        const bookmark = getBookmarkByMessageId(message.id);
        if (bookmark) {
          await removeBookmark(bookmark.id);
        }
      } else {
        // DB版のカテゴリ配列から最初のカテゴリ（デフォルト）を使用
        const defaultCategory = categories.length > 0 ? categories[0] : {
          id: 'a7212d4c-3ef8-4072-ba84-0b0197deeb8f', // 市場洞察カテゴリのUUID
          name: '市場洞察',
          color: 'bg-blue-500',
          icon: 'TrendingUp',
          description: '相場分析や市場動向に関する重要な情報'
        };
        await addBookmark(message, conversationId, defaultCategory);
      }
    } catch (error) {
      console.error('ブックマーク操作エラー:', error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  // 画像メッセージ用の表示処理
  const isImage = type === 'image';
  
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

  /** クリップボードにテキストをコピー */
  const handleCopyMessage = async () => {
    if (typeof children !== 'string' || isImage) return;
    try {
      await navigator.clipboard.writeText(children);
      // コピー成功状態をセット
      setIsCopied(true);
      // 2秒後に状態をリセット
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (e) {
      console.warn('[MessageBubble] Failed to copy message:', e);
    }
  };

  // コンテンツのレンダリング
  const renderContent = () => {
    // 画像の場合
    if (isImage) {
      const imageSource = imageUrl || (typeof children === 'string' && children.startsWith('data:image/') ? children : '');
      
      if (!imageSource) {
        // 画像ソースがない場合は代替テキストを表示
        return <div className="text-sm italic">画像を表示できません</div>;
      }

      return (
        <div className="relative overflow-hidden flex flex-col items-center">
          <div className={cn(
            "relative w-full",
            imageExpanded ? "max-w-full" : "max-w-md"
          )}>
            <img
              src={imageSource}
              alt={prompt || "チャートイメージ"}
              className={cn(
                "rounded-md border border-border", 
                imageExpanded 
                  ? "w-full max-h-[70vh]" 
                  : "w-full max-h-[250px] object-contain"
              )}
              onClick={handleImageClick}
              style={{ cursor: 'pointer' }}
            />
            <button
              onClick={handleImageClick}
              className="absolute top-2 right-2 p-1 bg-background/80 backdrop-blur-sm rounded-full text-foreground hover:bg-background"
              aria-label={imageExpanded ? "縮小" : "拡大"}
              title={imageExpanded ? "縮小" : "拡大"}
            >
              {imageExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
          {prompt && (
            <div className="w-full text-sm mt-2 px-2 text-foreground">
              {prompt}
            </div>
          )}
        </div>
      );
    }
    
    // テキストの場合
    if (typeof children === 'string') {
      // マークダウン記法が含まれているかチェック
      if (containsMarkdown(children)) {
        // マークダウンをHTMLに変換
        const htmlContent = parseMarkdownSafe(children);
        return (
          <div 
            className="markdown-content w-full"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        );
      }
      
      // テキストが長い場合にチャート分析かどうかを判断
      const isChartAnalysis = children.includes('###') || children.includes('SMA') || children.includes('RSI') || children.includes('MACD');
      
      // 改行をbrタグに変換
      const lines = children.split('\n');
      return (
        <div className={isChartAnalysis ? "chart-analysis-content w-full" : ""}>
          {lines.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      );
    }
    
    // その他の場合はそのまま返す
    return children;
  };
  
  // アバターのフォールバック文字を取得
  const getAvatarFallback = () => {
    if (role === "user") {
      return userName.charAt(0).toUpperCase() || "U";
    } else {
      return assistantName.charAt(0).toUpperCase() || "AI";
    }
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
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
        ) : avatar ? (
          avatar
        ) : (
          <Avatar className="h-5 w-5">
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
        )}
        <span className="font-medium">
          {role === "user" ? userName : assistantName}
        </span>
      </div>

      <div
        className={cn(
          "flex flex-col",
          isImage ? "max-w-full" : "max-w-[95%] sm:max-w-[85%] md:max-w-[85%]",
          role === "user" ? "items-end" : "items-start",
          !typing && "group"
        )}
      >
        <div className={cn("relative", isImage ? "w-full" : "w-full")}>
          <div
            className={cn(
              "rounded-lg h-fit",
              // 画像メッセージは背景色を調整
              isImage 
                ? (role === "user" 
                  ? "bg-primary/5 border border-primary/10" 
                  : "bg-muted/80 border border-muted-foreground/10") 
                : (role === "user"
                  ? "bg-primary text-neutral-900 dark:text-neutral-900 font-medium"
                  : "bg-muted text-foreground"),
              // パディングは画像の場合小さく
              isImage ? "p-2" : (typeof children === 'string' && containsMarkdown(children) ? "px-3 py-2" : "px-3 py-1.5"),
              typing && "motion-safe:animate-pulse",
              // 最大幅の制約をここで設定
              isImage ? "" : "w-full",
              // チャート分析のテキストは幅を広げる
              typeof children === 'string' && 
                (children.includes('###') || children.includes('SMA') || children.includes('RSI')) 
                ? "chart-analysis" : ""
            )}
          >
            <div className={cn(
              "break-words whitespace-pre-wrap text-pretty",
              isImage ? "flex justify-center" : "overflow-x-auto",
              // チャート分析用のカスタムクラスを追加
              typeof children === 'string' && 
                (children.includes('###') || children.includes('SMA') || children.includes('RSI')) 
                ? "chart-analysis-text" : ""
            )}>
              {typing ? <TypingIndicator /> : renderContent()}
            </div>
          </div>
          
        </div>
        
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
          {formattedDate}

          <div className="ml-auto flex gap-1">
            {/* コピーボタン - テキストメッセージのみ表示 */}
            {!isImage && !typing && typeof children === 'string' && (
              <button
                onClick={handleCopyMessage}
                className={cn(
                  'p-1 rounded',
                  isCopied 
                    ? 'text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  // コピー中は常に表示
                  isCopied 
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100',
                  'transition-all duration-200 ease-in-out',
                  'flex items-center text-xs gap-1'
                )}
                aria-label={isCopied ? "コピーしました" : "メッセージをコピー"}
                title={isCopied ? "コピーしました" : "メッセージをコピー"}
              >
                {isCopied ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    <span>コピーしました</span>
                  </>
                ) : (
                  <CopyIcon className="h-3 w-3" />
                )}
              </button>
            )}

            {/* 読み上げボタン - アシスタントメッセージかつテキストの場合のみ表示 */}
            {speechSynthesisEnabled && role === 'assistant' && !isImage && !typing && typeof children === 'string' && (
              <button
                onClick={handleSpeakMessage}
                className={cn(
                  'p-1 rounded',
                  'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  isSpeaking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  'transition-opacity',
                  'flex items-center text-xs gap-1'
                )}
                aria-label={isSpeaking ? '読み上げを停止' : 'メッセージを読み上げ'}
                title={isSpeaking ? '読み上げを停止' : 'メッセージを読み上げ'}
              >
                {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                <span>{isSpeaking ? '停止' : '読み上げ'}</span>
              </button>
            )}

            {/* ブックマークボタン - テキストメッセージかつmessage/conversationIdが存在する場合のみ表示 */}
            {!isImage && !typing && typeof children === 'string' && message && conversationId && (
              <button
                onClick={handleToggleBookmark}
                disabled={bookmarkLoading}
                className={cn(
                  'p-1 rounded',
                  messageIsBookmarked 
                    ? 'text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  messageIsBookmarked || bookmarkLoading
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100',
                  'transition-all duration-200 ease-in-out',
                  'flex items-center text-xs gap-1'
                )}
                aria-label={messageIsBookmarked ? "ブックマークを削除" : "ブックマークに追加"}
                title={messageIsBookmarked ? "ブックマークを削除" : "ブックマークに追加"}
              >
                <Bookmark className={cn("h-3 w-3", messageIsBookmarked && "fill-current")} />
                <span>{messageIsBookmarked ? 'ブックマーク済み' : 'ブックマーク'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default MessageBubble;
