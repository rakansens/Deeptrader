// src/mastra/tools/ui/basicUITools.ts
// 基本UIツール群
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { logger } from "@/lib/logger";

/**
 * グリッド表示切り替えツール
 */
export const toggleGridTool = createTool({
  id: "toggle_grid",
  description: "チャートのグリッド表示を切り替えます",
  inputSchema: z.object({
    enabled: z.boolean().describe("グリッドを表示するか"),
  }),
  execute: async ({ context }) => {
    const { enabled } = context;
    logger.info("グリッド表示切り替え", { enabled });
    return {
      success: true,
      message: `グリッド表示を${enabled ? '有効' : '無効'}にしました。`,
      state: { grid: enabled },
    };
  },
});

/**
 * ボリューム表示切り替えツール
 */
export const toggleVolumeTool = createTool({
  id: "toggle_volume",
  description: "ボリューム表示を切り替えます",
  inputSchema: z.object({
    enabled: z.boolean().describe("ボリュームを表示するか"),
  }),
  execute: async ({ context }) => {
    const { enabled } = context;
    logger.info("ボリューム表示切り替え", { enabled });
    return {
      success: true,
      message: `ボリューム表示を${enabled ? '有効' : '無効'}にしました。`,
      state: { volume: enabled },
    };
  },
});

/**
 * チャートスケール変更ツール
 */
export const changeChartScaleTool = createTool({
  id: "change_chart_scale",
  description: "チャートスケールを変更します",
  inputSchema: z.object({
    scale: z.enum(["auto", "linear", "log"]).describe("スケールタイプ"),
  }),
  execute: async ({ context }) => {
    const { scale } = context;
    const scaleNames = { auto: "自動", linear: "リニア", log: "ログ" };
    logger.info("チャートスケール変更", { scale });
    return {
      success: true,
      message: `チャートスケールを「${scaleNames[scale]}」に変更しました。`,
      state: { scale },
    };
  },
});

/**
 * 価格ラベル切り替えツール
 */
export const togglePriceLabelTool = createTool({
  id: "toggle_price_label",
  description: "価格ラベル表示を切り替えます",
  inputSchema: z.object({
    enabled: z.boolean().describe("価格ラベルを表示するか"),
  }),
  execute: async ({ context }) => {
    const { enabled } = context;
    logger.info("価格ラベル表示切り替え", { enabled });
    return {
      success: true,
      message: `価格ラベル表示を${enabled ? '有効' : '無効'}にしました。`,
      state: { priceLabel: enabled },
    };
  },
});

/**
 * チャートズームツール
 */
export const zoomChartTool = createTool({
  id: "zoom_chart",
  description: "チャートをズームします",
  inputSchema: z.object({
    action: z.enum(["in", "out", "reset", "fit"]).describe("ズームアクション"),
    factor: z.number().optional().describe("ズーム倍率"),
  }),
  execute: async ({ context }) => {
    const { action, factor } = context;
    const actionNames = { in: "拡大", out: "縮小", reset: "リセット", fit: "フィット" };
    logger.info("チャートズーム", { action, factor });
    return {
      success: true,
      message: `チャートを${actionNames[action]}しました。`,
      state: { zoom: action, factor },
    };
  },
});

/**
 * チャートパンツール
 */
export const panChartTool = createTool({
  id: "pan_chart",
  description: "チャートを移動します",
  inputSchema: z.object({
    direction: z.enum(["left", "right", "up", "down"]).describe("移動方向"),
    distance: z.number().optional().describe("移動距離"),
  }),
  execute: async ({ context }) => {
    const { direction, distance } = context;
    const directionNames = { left: "左", right: "右", up: "上", down: "下" };
    logger.info("チャートパン", { direction, distance });
    return {
      success: true,
      message: `チャートを${directionNames[direction]}に移動しました。`,
      state: { pan: direction, distance },
    };
  },
});

/**
 * 銘柄変更ツール
 */
export const changeSymbolTool = createTool({
  id: "change_symbol",
  description: "取引銘柄を変更します",
  inputSchema: z.object({
    symbol: z.string().describe("銘柄シンボル（例: BTCUSDT, ETHUSDT）"),
  }),
  execute: async ({ context }) => {
    const { symbol } = context;
    logger.info("銘柄変更", { symbol });
    return {
      success: true,
      message: `銘柄を「${symbol}」に変更しました。`,
      state: { symbol },
    };
  },
});

/**
 * テーマ変更ツール
 */
export const changeThemeTool = createTool({
  id: "change_theme",
  description: "チャートテーマを変更します",
  inputSchema: z.object({
    theme: z.enum(["light", "dark", "auto"]).describe("テーマ"),
  }),
  execute: async ({ context }) => {
    const { theme } = context;
    const themeNames = { light: "ライト", dark: "ダーク", auto: "自動" };
    logger.info("テーマ変更", { theme });
    return {
      success: true,
      message: `テーマを「${themeNames[theme]}」に変更しました。`,
      state: { theme },
    };
  },
});

/**
 * チャートリセットツール
 */
export const resetChartTool = createTool({
  id: "reset_chart",
  description: "チャート設定をリセットします",
  inputSchema: z.object({
    resetType: z.enum(["all", "indicators", "drawings", "zoom"]).describe("リセット範囲"),
  }),
  execute: async ({ context }) => {
    const { resetType } = context;
    const resetNames = { 
      all: "全設定", 
      indicators: "インジケーター", 
      drawings: "描画", 
      zoom: "ズーム" 
    };
    logger.info("チャートリセット", { resetType });
    return {
      success: true,
      message: `${resetNames[resetType]}をリセットしました。`,
      state: { reset: resetType },
    };
  },
});

/**
 * 描画ツール
 */
export const addDrawingTool = createTool({
  id: "add_drawing",
  description: "チャートに描画を追加します",
  inputSchema: z.object({
    type: z.enum(["trendline", "horizontal", "vertical", "fibonacci", "rectangle"]).describe("描画タイプ"),
    points: z.array(z.object({
      x: z.number(),
      y: z.number(),
    })).optional().describe("描画ポイント"),
  }),
  execute: async ({ context }) => {
    const { type, points } = context;
    const typeNames = {
      trendline: "トレンドライン",
      horizontal: "水平線",
      vertical: "垂直線",
      fibonacci: "フィボナッチ",
      rectangle: "四角形",
    };
    logger.info("描画追加", { type, points });
    return {
      success: true,
      message: `${typeNames[type]}を追加しました。`,
      state: { drawing: type, points },
    };
  },
});

/**
 * フルスクリーン切り替えツール
 */
export const toggleFullscreenTool = createTool({
  id: "toggle_fullscreen",
  description: "フルスクリーン表示を切り替えます",
  inputSchema: z.object({
    enabled: z.boolean().describe("フルスクリーンにするか"),
  }),
  execute: async ({ context }) => {
    const { enabled } = context;
    logger.info("フルスクリーン切り替え", { enabled });
    return {
      success: true,
      message: `フルスクリーン表示を${enabled ? '有効' : '無効'}にしました。`,
      state: { fullscreen: enabled },
    };
  },
}); 