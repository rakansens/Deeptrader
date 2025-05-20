export type DrawingMode =
  | 'freehand'
  | 'trendline'
  | 'fibonacci'
  | 'horizontal-line'
  | 'box'
  | 'arrow'
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
}

/** デフォルトのインジケーター設定 */
export const DEFAULT_INDICATOR_SETTINGS: IndicatorSettings = {
  sma: 14,
  rsi: 14,
  macd: { short: 12, long: 26, signal: 9 },
  boll: 20,
};

export type IndicatorsChangeHandler = (
  value: IndicatorOptions,
) => void;

export type { ChartTheme } from '../hooks/use-chart-theme';
