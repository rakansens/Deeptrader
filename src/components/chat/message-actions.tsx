"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, ClipboardCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";

interface MessageActionsProps {
  text: string;
  userId?: string;
  messageId?: string;
  compact?: boolean;
  noSpeech?: boolean;
  className?: string;
}

export function MessageActions({
  text,
  userId,
  messageId,
  compact = false,
  noSpeech = false,
  className,
}: MessageActionsProps) {
  const { speechSynthesisEnabled, speechRate } = useSettings();
  const { toast } = useToast();
  const [speaking, setSpeaking] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "コピー完了",
        description: "メッセージをクリップボードにコピーしました",
      });
    } catch (err) {
      console.error("クリップボードへのコピーに失敗しました", err);
      toast({
        title: "コピーに失敗しました",
        description: "権限が許可されていない可能性があります",
        variant: "destructive",
      });
    }
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      toast({
        title: "読み上げに失敗しました",
        description: "このブラウザは音声合成をサポートしていません",
        variant: "destructive",
      });
      return;
    }

    // 既に再生中なら停止
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP"; // 日本語に設定

    // 音声速度を設定から取得
    utterance.rate = speechRate;

    // 音声再生完了時のイベント
    utterance.onend = () => {
      setSpeaking(false);
    };

    // エラー時のイベント
    utterance.onerror = (event) => {
      console.error("音声合成エラー:", event);
      setSpeaking(false);
      toast({
        title: "読み上げに失敗しました",
        description: "音声合成中にエラーが発生しました",
        variant: "destructive",
      });
    };

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={cn(
        "flex gap-2",
        compact ? "opacity-70 scale-90" : "mt-2",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-md text-muted-foreground hover:text-foreground",
          compact && "h-7 w-7"
        )}
        onClick={handleCopy}
        aria-label="メッセージをコピー"
      >
        <ClipboardCopy className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
      </Button>

      {!noSpeech && speechSynthesisEnabled && (
        <Button
          variant={speaking ? "default" : "ghost"}
          size="icon"
          className={cn(
            "h-8 w-8 rounded-md text-muted-foreground",
            speaking
              ? "text-primary-foreground"
              : "hover:text-foreground",
            compact && "h-7 w-7"
          )}
          onClick={handleSpeak}
          aria-label={speaking ? "読み上げを停止" : "メッセージを読み上げ"}
        >
          <Volume2 className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
        </Button>
      )}
    </div>
  );
}

export default MessageActions; 