export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

export const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'BNBUSDT', label: 'BNB/USDT' },
] as const;

export type Timeframe = (typeof TIMEFRAMES)[number];

export type SymbolValue = (typeof SYMBOLS)[number]['value'];

/** 各時間枠に対応するミリ秒数 */
export const TIMEFRAME_TO_MS: Record<Timeframe, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
} as const;
