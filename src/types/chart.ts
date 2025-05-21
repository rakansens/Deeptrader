export const DRAWING_MODES = {
  FREEHAND: "freehand",
  TRENDLINE: "trendline",
  FIBONACCI: "fibonacci",
  HORIZONTAL_LINE: "horizontal-line",
  BOX: "box",
  ARROW: "arrow",
  RULER: "ruler",
  TEXT: "text",
  ERASER: "eraser",
} as const;
export type DrawingMode = typeof DRAWING_MODES[keyof typeof DRAWING_MODES] | null;

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
  /** RSIの買われすぎ水準 */
  rsiUpper: number;
  /** RSIの売られすぎ水準 */
  rsiLower: number;
  /** MACDの短期・長期・シグナル期間 */
  macd: {
    short: number;
    long: number;
    signal: number;
  };
  /** ボリンジャーバンドの期間 */
  boll: { period: number; stdDev: number };
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

export type IndicatorsChangeHandler = (value: IndicatorOptions) => void;

export interface ChartTheme {
  background: string;
  text: string;
  grid: string;
  crosshair: string;
  upColor: string;
  downColor: string;
  volume: string;
}
