"use client";

import { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpIcon, ImagePlus, Loader2, Mic, MicOff, TrendingUp } from "lucide-react";
import CommandCompletion from "./command-completion";
import { commandToText } from "@/lib/commands";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  onSendMessage: () => void;
  onScreenshot: () => void;
  onUploadImage: (file: File) => Promise<void> | void;
  voiceInputEnabled: boolean;
  isListening: boolean;
  toggleListening: () => void;
  recordingTime: number;
  textAreaRef?: React.RefObject<HTMLTextAreaElement>;
  navigateHistory: (direction: 'up' | 'down') => void;
  resetHistoryNavigation: () => void;
  messageHistory: string[];
}

export function ChatInput({
  input,
  setInput,
  loading,
  onSendMessage,
  onScreenshot,
  onUploadImage,
  voiceInputEnabled,
  isListening,
  toggleListening,
  recordingTime,
  textAreaRef,
  navigateHistory,
  resetHistoryNavigation,
  messageHistory,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  // コマンド補完の状態管理
  const [showCommandCompletion, setShowCommandCompletion] = useState(false);

  // デバッグ用：音声入力設定の状態をログ出力
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ChatInput - voiceInputEnabled:', voiceInputEnabled);
    }
  }, [voiceInputEnabled]);

  // コマンド補完の表示制御
  useEffect(() => {
    const shouldShow = input.startsWith('/') && input.length > 0 && !loading;
    setShowCommandCompletion(shouldShow);
  }, [input, loading]);

  /**
   * ファイルをアップロードする共通処理
   * @param file - 画像ファイル
   */
  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      await onUploadImage(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  // 実際に表示するかどうかを決定する変数（フラグ）
  const showVoiceInput = voiceInputEnabled === true;

  return (
    <div
      className={cn(
        "mt-4 relative",
        dragging && "ring-2 ring-primary rounded-md"
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="chat-input"
    >
      <div className="flex justify-end mb-2 space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="チャートを送信"
                onClick={onScreenshot}
                disabled={loading}
                size="icon"
                variant="ghost"
                className="relative flex items-center justify-center h-9 w-9 rounded-md bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300 ease-in-out"
              >
                <TrendingUp className="h-4 w-4 transition-transform hover:scale-110 duration-200" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="bg-background/95 backdrop-blur-sm border-border shadow-sm">
              <p className="text-xs font-medium">チャートを送信</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          data-testid="image-input"
        />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploading}
                size="icon"
                variant="ghost"
                aria-label="画像をアップロード"
                className="relative flex items-center justify-center h-9 w-9 rounded-md bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300 ease-in-out"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4 transition-transform hover:scale-110 duration-200" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="bg-background/95 backdrop-blur-sm border-border shadow-sm">
              <p className="text-xs font-medium">画像をアップロード</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Textarea
        value={input}
        onChange={(e) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 ChatInput onChange:', e.target.value);
          }
          setInput(e.target.value);
          // 入力変更時に履歴ナビゲーション状態をリセット
          resetHistoryNavigation();
        }}
        onCompositionStart={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🎌 IME入力開始');
          }
          setIsComposing(true);
        }}
        onCompositionEnd={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🎌 IME入力終了');
          }
          setIsComposing(false);
        }}
        placeholder={loading ? "送信中..." : "メッセージを入力..."}
        aria-label="メッセージ入力"
        disabled={loading}
        className={cn(
          "min-h-[80px] resize-none pr-12",
          "focus-visible:ring-primary",
          "bg-background/95 backdrop-blur-sm border-border shadow-sm",
          "transition-colors duration-200",
          loading && "cursor-not-allowed opacity-60",
          showVoiceInput ? "pl-20" : "pl-4"
        )}
        onKeyDown={(e) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('⌨️ KeyDown:', e.key, 'isComposing:', isComposing);
          }
          
          // 履歴ナビゲーション（↑/↓キー）
          if (e.key === "ArrowUp" && !isComposing && !loading) {
            e.preventDefault();
            navigateHistory('up');
            return;
          }
          
          if (e.key === "ArrowDown" && !isComposing && !loading) {
            e.preventDefault();
            navigateHistory('down');
            return;
          }
          
          // 通常の送信処理
          if (e.key === "Enter" && !e.shiftKey && !isComposing && !loading) {
            e.preventDefault();
            if (process.env.NODE_ENV === 'development') {
              console.log('📤 Enterキーで送信実行');
            }
            onSendMessage();
          }
        }}
        ref={textAreaRef}
      />

      {/* 文字数カウント表示 */}
      <div className="flex justify-between items-center mt-1 px-1">
        <div className="text-xs text-muted-foreground">
          {input.length > 0 && (
            <span className={cn(
              "transition-colors duration-200",
              input.length > 2000 ? "text-red-500" : 
              input.length > 1500 ? "text-yellow-500" : 
              "text-muted-foreground"
            )}>
              {input.length.toLocaleString()} 文字
              {input.length > 2000 && " (制限に近づいています)"}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {messageHistory.length > 0 && (
            <span>履歴: {messageHistory.length}件</span>
          )}
          {input.trim() && input.includes('\n') ? (
            <span>Shift+Enter で改行</span>
          ) : (
            <span>↑↓ で履歴</span>
          )}
        </div>
      </div>

      {/* 明示的にshowVoiceInputを評価して表示・非表示を制御 */}
      {showVoiceInput && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <Button
                  type="button"
                  onClick={toggleListening}
                  size="icon"
                  variant="ghost"
                  disabled={loading}
                  aria-label={isListening ? "音声入力を停止" : "音声入力を開始"}
                  className={cn(
                    "h-8 w-8 rounded-md transition-all duration-300",
                    isListening && "bg-red-500/90 text-white hover:bg-red-500",
                    !isListening && "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                {isListening && (
                  <span
                    className="text-xs text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded animate-pulse"
                    data-testid="recording-timer"
                  >
                    {new Date(recordingTime).toISOString().substring(14, 19)}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-background/95 backdrop-blur-sm border-border shadow-sm">
              <p className="text-xs font-medium">{isListening ? "音声入力を停止" : "音声入力を開始"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="submit"
              size="icon"
              onClick={onSendMessage}
              disabled={loading || !input.trim()}
              aria-label={loading ? "送信中..." : "送信"}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md",
                "bg-primary text-primary-foreground",
                "transition-all duration-300",
                "hover:bg-primary/90",
                loading && "cursor-not-allowed opacity-75",
                !loading && "disabled:opacity-50",
                "disabled:pointer-events-none"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
              ) : (
                <ArrowUpIcon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="end" className="bg-background/95 backdrop-blur-sm border-border shadow-sm">
            <p className="text-xs font-medium">
              {loading ? "送信中..." : !input.trim() ? "メッセージを入力してください" : "送信"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* コマンド補完 */}
      <CommandCompletion
        input={input}
        onSelectCommand={(command) => {
          // コマンドが実際のテキストかどうかチェック
          if (command.startsWith('/')) {
            // コマンド形式の場合はそのまま設定
            setInput(command);
          } else {
            // 既に変換済みテキストの場合は設定して送信
            setInput(command);
            // 少し遅延を入れて送信
            setTimeout(() => {
              onSendMessage();
            }, 50);
          }
          setShowCommandCompletion(false);
        }}
        isVisible={showCommandCompletion}
        onClose={() => setShowCommandCompletion(false)}
        textAreaRef={textAreaRef || { current: null }}
      />
    </div>
  );
}

export default ChatInput; 