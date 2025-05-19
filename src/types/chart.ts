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

export type IndicatorsChangeHandler = (
  value: IndicatorOptions,
) => void;

export type { ChartTheme } from '../hooks/use-chart-theme';
