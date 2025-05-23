"use client";

import { useCallback } from "react";
import { captureChart } from "@/lib/chart";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

interface UseScreenshotOptions {
  onCapture?: (url: string) => Promise<void> | void;
}

/**
 * スクリーンショット取得を管理するカスタムフック
 */
export function useScreenshot({ onCapture }: UseScreenshotOptions = {}) {
  const { toast, dismiss } = useToast();

  const captureScreenshot = useCallback(async () => {
    try {
      // キャプチャ開始通知
      const captureToast = toast({
        title: "📸 チャートキャプチャ中",
        description: "チャートの画像を取得しています...",
        duration: 5000, // 長めの表示時間を設定
      });

      // チャートをキャプチャ
      const url = await captureChart();
      
      if (!url) {
        toast({
          title: "❌ キャプチャ失敗",
          description: "チャートの画像を取得できませんでした",
          variant: "destructive",
        });
        return;
      }

      // 前のトーストを閉じる
      if (captureToast) {
        dismiss(captureToast.id);
      }

      // 分析開始通知
      toast({
        title: "🔍 チャート分析中",
        description: "キャプチャしたチャートを分析しています...",
        duration: 5000,
      });

      // キャプチャした画像を処理するコールバックを実行
      await onCapture?.(url);

      // 成功通知
      toast({
        title: "✅ 分析完了",
        description: "チャート分析結果が表示されました",
        duration: 3000,
      });
    } catch (err) {
      logger.error("スクリーンショット処理エラー:", err);
      toast({
        title: "❌ エラー",
        description: "チャートの処理に失敗しました",
        variant: "destructive",
      });
    }
  }, [onCapture, toast, dismiss]);

  return { captureScreenshot };
}

export default useScreenshot;
