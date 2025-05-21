"use client";

import { useRef, useState } from "react";
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
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

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
        <Button
          aria-label="スクリーンショット送信"
          onClick={onScreenshot}
          disabled={loading}
          size="sm"
          variant="outline"
          className="relative flex items-center justify-center h-9 w-9 rounded-full border border-input text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300 ease-in-out overflow-hidden group hover:w-auto hover:pl-3 hover:pr-4"
        >
          <TrendingUp className="h-5 w-5 min-w-5 transition-transform group-hover:scale-110 duration-200 text-inherit" />
          <span className="max-w-0 whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out text-sm font-medium">チャートを送信</span>
        </Button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          data-testid="image-input"
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || uploading}
          size="sm"
          variant="outline"
          aria-label="画像をアップロード"
          className="relative flex items-center justify-center h-9 w-9 rounded-full border border-input text-muted-foreground hover:text-primary hover:border-primary"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
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
          voiceInputEnabled ? "pl-20" : "pl-4"
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
          }
        }}
      />

      {voiceInputEnabled && (
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
                    "h-8 w-8 border",
                    isListening && "bg-red-500 text-white border-0",
                    !isListening && "text-muted-foreground"
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
                    className="text-xs text-muted-foreground"
                    data-testid="recording-timer"
                  >
                    {new Date(recordingTime).toISOString().substring(14, 19)}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{isListening ? "音声入力を停止" : "音声入力を開始"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Button
        type="submit"
        size="icon"
        onClick={onSendMessage}
        disabled={loading || !input.trim()}
        aria-label="送信"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-primary-foreground"
      >
        <ArrowUpIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default ChatInput; 