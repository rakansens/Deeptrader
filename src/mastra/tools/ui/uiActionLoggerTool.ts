// src/mastra/tools/ui/uiActionLoggerTool.ts
// UI操作ログツール
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { logger } from "@/lib/logger";

/**
 * UI操作ログツール
 * UI操作の履歴を記録・取得する
 */
export const uiActionLoggerTool = createTool({
  id: "ui_action_logger",
  description: "UI操作のログを記録・取得します",
  inputSchema: z.object({
    action: z.enum(["log", "get_history", "clear"]).describe("実行するアクション"),
    operation: z.string().optional().describe("記録する操作名"),
    details: z.record(z.any()).optional().describe("操作の詳細"),
    limit: z.number().default(10).describe("取得するログの件数"),
  }),
  execute: async ({ context }) => {
    try {
      const { action, operation, details, limit } = context;
      const timestamp = new Date().toISOString();
      
      switch (action) {
        case "log":
          // UI操作をログに記録
          if (operation) {
            logger.info("UI操作ログ", {
              operation: operation,
              details: details || {},
              timestamp: timestamp,
              type: "UI_ACTION",
            });
            
            return {
              success: true,
              message: `UI操作「${operation}」をログに記録しました。`,
              timestamp: timestamp,
            };
          } else {
            throw new Error("操作名が指定されていません");
          }
          
        case "get_history":
          // UI操作履歴を取得（シミュレート）
          const mockHistory = [
            {
              id: "1",
              operation: "CHART_TYPE_CHANGE",
              details: { from: "candlestick", to: "line" },
              timestamp: new Date(Date.now() - 60000).toISOString(),
            },
            {
              id: "2", 
              operation: "TIMEFRAME_CHANGE",
              details: { from: "1h", to: "4h" },
              timestamp: new Date(Date.now() - 120000).toISOString(),
            },
            {
              id: "3",
              operation: "INDICATOR_TOGGLE",
              details: { indicator: "RSI", state: "enabled" },
              timestamp: new Date(Date.now() - 180000).toISOString(),
            },
          ].slice(0, limit);
          
          return {
            success: true,
            message: `UI操作履歴を${mockHistory.length}件取得しました。`,
            history: mockHistory,
            timestamp: timestamp,
          };
          
        case "clear":
          // ログクリア（シミュレート）
          logger.info("UI操作ログをクリアしました", {
            action: "LOG_CLEAR",
            timestamp: timestamp,
          });
          
          return {
            success: true,
            message: "UI操作ログをクリアしました。",
            timestamp: timestamp,
          };
          
        default:
          throw new Error(`未知のアクション: ${action}`);
      }
    } catch (error) {
      logger.error("UI操作ログエラー:", error);
      return {
        success: false,
        error: `UI操作ログの処理に失敗しました: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
}); 