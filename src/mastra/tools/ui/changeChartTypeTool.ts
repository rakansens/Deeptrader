// src/mastra/tools/ui/changeChartTypeTool.ts
// チャートタイプ変更ツール
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { logger } from "@/lib/logger";

/**
 * チャートタイプ変更ツール
 * ローソク足、ライン、エリア等のチャート表示タイプを変更
 */
export const changeChartTypeTool = createTool({
  id: "change_chart_type",
  description: "チャートの表示タイプを変更します（ローソク足、ライン、エリア等）",
  inputSchema: z.object({
    chartType: z.enum([
      "candlestick",    // ローソク足
      "line",           // ラインチャート
      "area",           // エリアチャート
      "heikin-ashi",    // 平均足
      "bar",            // バーチャート
      "mountain",       // 山チャート
      "baseline",       // ベースラインチャート
    ]).describe("変更するチャートタイプ"),
    logAction: z.boolean().default(true).describe("操作をログに記録するか"),
  }),
  execute: async ({ context }) => {
    try {
      const { chartType, logAction } = context;
      const timestamp = new Date().toISOString();
      
      // UI状態の変更をシミュレート（実際のUIとの連携）
      const uiState = {
        before: "candlestick", // 現在の状態
        after: chartType,
        timestamp: timestamp,
      };
      
      // ログ記録
      if (logAction) {
        logger.info("UI操作: チャートタイプ変更", {
          action: "changeChartType",
          before: uiState.before,
          after: uiState.after,
          timestamp: timestamp,
        });
      }
      
      // チャートタイプの日本語名
      const chartTypeNames: Record<string, string> = {
        candlestick: "ローソク足",
        line: "ライン",
        area: "エリア",
        "heikin-ashi": "平均足",
        bar: "バー",
        mountain: "山",
        baseline: "ベースライン",
      };
      
      return {
        success: true,
        action: "チャートタイプ変更",
        details: {
          chartType: chartType,
          chartTypeName: chartTypeNames[chartType] || chartType,
          previousType: uiState.before,
          timestamp: timestamp,
        },
        message: `チャートタイプを「${chartTypeNames[chartType] || chartType}」に変更しました。`,
        logEntry: {
          operation: "UI_CHART_TYPE_CHANGE",
          before: uiState.before,
          after: chartType,
          timestamp: timestamp,
        }
      };
    } catch (error) {
      logger.error("チャートタイプ変更エラー:", error);
      return {
        success: false,
        error: `チャートタイプの変更に失敗しました: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
}); 