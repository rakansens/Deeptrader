import type { UTCTimestamp } from 'lightweight-charts'

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
export type IndicatorsChangeHandler = (value: IndicatorOptions) => void;

export interface ChartTheme {
  background: string;
  text: string;
  grid: string;
  crosshair: string;
  upColor: string;
  downColor: string;
  volume: string;
  ma7?: string;
  ma25?: string;
  ma99?: string;
}

export interface CrosshairInfo {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  change: number;
  changePercent: number;
}
