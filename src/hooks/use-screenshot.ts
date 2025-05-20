"use client";

import { useCallback } from "react";
import { captureChart } from "@/lib/captureChart";
import { useToast } from "@/hooks/use-toast";

interface UseScreenshotOptions {
  onCapture?: (url: string) => Promise<void> | void;
}

/**
 * スクリーンショット取得を管理するカスタムフック
 */
export function useScreenshot({ onCapture }: UseScreenshotOptions = {}) {
  const { toast } = useToast();

  const captureScreenshot = useCallback(async () => {
    try {
      toast({
        title: "📸 チャートキャプチャ中",
        description: "チャートの画像を取得しています...",
        duration: 3000,
      });

      const url = await captureChart();
      if (!url) {
        toast({
          title: "❌ エラー",
          description: "チャートのキャプチャに失敗しました",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✅ キャプチャ成功",
        description: "チャートイメージを送信しました",
        duration: 2000,
      });

      await onCapture?.(url);
    } catch (err) {
      console.error("スクリーンショット送信エラー:", err);
      toast({
        title: "❌ エラー",
        description: "スクリーンショットの送信に失敗しました",
        variant: "destructive",
      });
    }
  }, [onCapture, toast]);

  return { captureScreenshot };
}

export default useScreenshot; 