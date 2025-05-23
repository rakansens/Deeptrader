// src/mastra/tools/ui/realUITools.ts
// WebSocket連携による実際のUI操作ツール群
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { uiCommandServer } from "@/lib/websocket/uiCommandServer";

/**
 * 実際のタイムフレーム変更ツール（WebSocket版）
 */
export const realChangeTimeframeTool = createTool({
  id: "real_change_timeframe",
  description: "実際にチャートのタイムフレームを変更します（WebSocket連携）",
  inputSchema: z.object({
    timeframe: z.enum(['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M']).describe('タイムフレーム'),
  }),
  execute: async ({ context }) => {
    try {
      const { timeframe } = context;
      const timestamp = new Date().toISOString();
      
      // WebSocket経由でUI操作命令を送信
      const success = await uiCommandServer.executeUIOperation('change_timeframe', {
        timeframe,
        timestamp,
      });
      
      if (success) {
        logger.info("実際のタイムフレーム変更:", { timeframe, timestamp });
        return {
          success: true,
          message: `チャートのタイムフレームを${timeframe}に変更しました。`,
          operation: "REAL_TIMEFRAME_CHANGE",
          payload: { timeframe },
          timestamp,
          clients: uiCommandServer.getClientCount(),
        };
      } else {
        throw new Error("WebSocketクライアントが接続されていません");
      }
    } catch (error) {
      logger.error("実際のタイムフレーム変更エラー:", error);
      return {
        success: false,
        error: `タイムフレームの変更に失敗しました: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
});

/**
 * 実際のインジケーター切り替えツール（WebSocket版）
 */
export const realToggleIndicatorTool = createTool({
  id: "real_toggle_indicator", 
  description: "実際にインジケーター表示を切り替えます（WebSocket連携）",
  inputSchema: z.object({
    indicator: z.string().describe("インジケーター名"),
    enabled: z.boolean().optional().describe("表示状態"),
  }),
  execute: async ({ context }) => {
    try {
      const { indicator, enabled } = context;
      const timestamp = new Date().toISOString();
      
      const success = await uiCommandServer.executeUIOperation('toggle_indicator', {
        indicator,
        enabled,
        timestamp,
      });
      
      if (success) {
        logger.info("実際のインジケーター切り替え:", { indicator, enabled, timestamp });
        return {
          success: true,
          message: `インジケーター「${indicator}」を${enabled ? '表示' : '非表示'}にしました。`,
          operation: "REAL_INDICATOR_TOGGLE",
          payload: { indicator, enabled },
          timestamp,
          clients: uiCommandServer.getClientCount(),
        };
      } else {
        throw new Error("WebSocketクライアントが接続されていません");
      }
    } catch (error) {
      logger.error("実際のインジケーター切り替えエラー:", error);
      return {
        success: false,
        error: `インジケーターの切り替えに失敗しました: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
});

/**
 * 実際のテーマ変更ツール（WebSocket版）
 */
export const realChangeThemeTool = createTool({
  id: "real_change_theme",
  description: "実際にチャートテーマを変更します（WebSocket連携）",
  inputSchema: z.object({
    theme: z.enum(["light", "dark", "auto"]).describe("テーマ"),
  }),
  execute: async ({ context }) => {
    try {
      const { theme } = context;
      const timestamp = new Date().toISOString();
      
      const success = await uiCommandServer.executeUIOperation('change_theme', {
        theme,
        timestamp,
      });
      
      if (success) {
        const themeNames = { light: "ライト", dark: "ダーク", auto: "自動" };
        logger.info("実際のテーマ変更:", { theme, timestamp });
        return {
          success: true,
          message: `テーマを「${themeNames[theme]}」に変更しました。`,
          operation: "REAL_THEME_CHANGE",
          payload: { theme },
          timestamp,
          clients: uiCommandServer.getClientCount(),
        };
      } else {
        throw new Error("WebSocketクライアントが接続されていません");
      }
    } catch (error) {
      logger.error("実際のテーマ変更エラー:", error);
      return {
        success: false,
        error: `テーマの変更に失敗しました: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
});

/**
 * 実際の銘柄変更ツール（WebSocket版）
 */
export const realChangeSymbolTool = createTool({
  id: "real_change_symbol",
  description: "実際に取引銘柄を変更します（WebSocket連携）",
  inputSchema: z.object({
    symbol: z.string().describe("銘柄シンボル（例: BTCUSDT, ETHUSDT）"),
  }),
  execute: async ({ context }) => {
    try {
      const { symbol } = context;
      const timestamp = new Date().toISOString();
      
      const success = await uiCommandServer.executeUIOperation('change_symbol', {
        symbol,
        timestamp,
      });
      
      if (success) {
        logger.info("実際の銘柄変更:", { symbol, timestamp });
        return {
          success: true,
          message: `銘柄を「${symbol}」に変更しました。`,
          operation: "REAL_SYMBOL_CHANGE",
          payload: { symbol },
          timestamp,
          clients: uiCommandServer.getClientCount(),
        };
      } else {
        throw new Error("WebSocketクライアントが接続されていません");
      }
    } catch (error) {
      logger.error("実際の銘柄変更エラー:", error);
      return {
        success: false,
        error: `銘柄の変更に失敗しました: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
});

/**
 * 実際のズーム操作ツール（WebSocket版）
 */
export const realZoomChartTool = createTool({
  id: "real_zoom_chart",
  description: "実際にチャートをズームします（WebSocket連携）",
  inputSchema: z.object({
    action: z.enum(["in", "out", "reset", "fit"]).describe("ズームアクション"),
    factor: z.number().optional().describe("ズーム倍率"),
  }),
  execute: async ({ context }) => {
    try {
      const { action, factor } = context;
      const timestamp = new Date().toISOString();
      
      const success = await uiCommandServer.executeUIOperation('zoom_chart', {
        action,
        factor,
        timestamp,
      });
      
      if (success) {
        const actionNames = { in: "拡大", out: "縮小", reset: "リセット", fit: "フィット" };
        logger.info("実際のチャートズーム:", { action, factor, timestamp });
        return {
          success: true,
          message: `チャートを${actionNames[action]}しました。`,
          operation: "REAL_CHART_ZOOM",
          payload: { action, factor },
          timestamp,
          clients: uiCommandServer.getClientCount(),
        };
      } else {
        throw new Error("WebSocketクライアントが接続されていません");
      }
    } catch (error) {
      logger.error("実際のチャートズームエラー:", error);
      return {
        success: false,
        error: `チャートズームに失敗しました: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
}); 