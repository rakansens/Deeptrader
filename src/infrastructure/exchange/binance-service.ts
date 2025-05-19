import type { BinanceKline } from '@/types/binance';

/**
 * Binance APIの基本URL
 */
const BASE_URL = process.env.BINANCE_BASE_URL ?? 'https://api.binance.com';

/**
 * ローソク足データを取得する
 * @param symbol - 例: "BTCUSDT"
 * @param interval - 例: "1h"
 * @param limit - 取得する本数
 * @returns Kline配列
 */
export async function fetchKlines(
  symbol: string,
  interval: string,
  limit = 100,
): Promise<BinanceKline[]> {
  const url = new URL('/api/v3/klines', BASE_URL);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch klines: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as BinanceKline[];
  return data;
}
