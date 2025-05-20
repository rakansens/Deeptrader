export const DRAWING_MODES = [
  "freehand",
  "trendline",
  "fibonacci",
  "horizontal-line",
  "box",
  "arrow",
  "eraser",
] as const;
export type DrawingMode =
  | 'freehand'
  | 'trendline'
  | 'fibonacci'
  | 'horizontal-line'
  | 'box'
  | 'arrow'
  | 'text'
  | 'eraser'
  | null;

export interface DrawingCanvasHandle {
  clear: () => void;
}

export interface IndicatorOptions {
  ma: boolean;
  rsi: boolean;
  macd?: boolean;
  boll?: boolean;
}

/**
 * インジケーター計算に使用する期間設定
 */
export interface IndicatorSettings {
  /** 単純移動平均の期間 */
  sma: number;
  /** RSIの期間 */
  rsi: number;
  /** MACDの短期・長期・シグナル期間 */
  macd: {
    short: number;
    long: number;
    signal: number;
  };
  /** ボリンジャーバンドの期間 */
  boll: number;
  /** ライン幅設定 */
  lineWidth: {
    ma: number;
    rsi: number;
    macd: number;
    boll: number;
  };
  colors?: {
    ma?: string;
    rsi?: string;
    macd?: string;
    boll?: string;
  };
}

/** デフォルトのインジケーター設定 */
export const DEFAULT_INDICATOR_SETTINGS: IndicatorSettings = {
  sma: 14,
  rsi: 14,
  macd: { short: 12, long: 26, signal: 9 },
  boll: 20,
  lineWidth: { ma: 2, rsi: 2, macd: 2, boll: 1 },
  colors: {
    ma: '#FF6347',
    rsi: '#4682B4',
    macd: '#32CD32',
    boll: '#FFD700',
  },
};

export type IndicatorsChangeHandler = (value: IndicatorOptions) => void;

export type { ChartTheme } from "../hooks/use-chart-theme";
