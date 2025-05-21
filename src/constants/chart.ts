import type { IndicatorSettings } from '@/types/chart';

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
