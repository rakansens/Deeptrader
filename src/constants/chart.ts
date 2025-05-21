export type Timeframe =
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '6h' | '8h'
  | '12h' | '1d' | '3d' | '1w' | '1M';

export const TIMEFRAMES: Timeframe[] = [
  '1m','3m','5m','15m','30m',
  '1h','2h','4h','6h','8h',
  '12h','1d','3d','1w','1M',
];

export interface SymbolOption { label:string; value: string; }
export const SYMBOLS: SymbolOption[] = [
  { label:'BTC/USDT', value:'BTCUSDT' },
  { label:'ETH/USDT', value:'ETHUSDT' },
  { label:'BNB/USDT', value:'BNBUSDT' },
];

export type SymbolValue = string;

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

/** indicator run-time knobs used across hooks & tools */

export const DEFAULT_INDICATOR_SETTINGS: IndicatorSettings = {
  sma: 14,
  rsi: 14,
  rsiUpper: 70,
  rsiLower: 30,
  macd: { short:12, long:26, signal:9 },
  boll: { period:20, stdDev:2 },
  lineWidth: { ma: 2, rsi: 2, macd: 2, boll: 1 },
  colors: {
    ma: '#FF6347',
    rsi: '#4682B4',
    macd: '#32CD32',
    boll: '#FFD700',
  },
};

/** 各時間枠に対応するミリ秒数 */
export const TIMEFRAME_TO_MS: Record<Timeframe, number> = {
  '1m': 60_000,
  '3m': 180_000,
  '5m': 300_000,
  '15m': 900_000,
  '30m': 1_800_000,
  '1h': 3_600_000,
  '2h': 7_200_000,
  '4h': 14_400_000,
  '6h': 21_600_000,
  '8h': 28_800_000,
  '12h': 43_200_000,
  '1d': 86_400_000,
  '3d': 259_200_000,
  '1w': 604_800_000,
  '1M': 2_592_000_000,
} as const;

/**
 * チャート上の描画色オプション
 */
export const DRAWING_COLORS = [
  { label: '赤', value: '#FF0000' },
  { label: '青', value: '#0000FF' },
  { label: '緑', value: '#00FF00' },
  { label: '黄', value: '#FFFF00' },
  { label: '黒', value: '#000000' },
  { label: '白', value: '#FFFFFF' },
];
