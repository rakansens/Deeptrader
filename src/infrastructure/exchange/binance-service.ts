import type { BinanceKline, BinanceKlineObject } from '@/types/binance';
import { BINANCE_BASE_URL } from '@/lib/env';
import { fetchWithTimeout } from '@/lib/fetch';

/**
 * Binance APIの基本URL
 */
const BASE_URL = BINANCE_BASE_URL;

/**
 * Binance APIからのタプル形式データをオブジェクト形式に変換
 */
export function klineTupleToObject(k: BinanceKline): BinanceKlineObject {
  const [
    openTime,
    open,
    high,
    low,
    close,
    volume,
    closeTime,
    quoteAssetVolume,
    tradeCount,
    takerBuyBaseVolume,
    takerBuyQuoteVolume,
    ignore,
  ] = k;
  return {
    openTime,
    open,
    high,
    low,
    close,
    volume,
    closeTime,
    quoteAssetVolume,
    tradeCount,
    takerBuyBaseVolume,
    takerBuyQuoteVolume,
    ignore,
  };
}

/**
 * ローソク足データを取得する
 * @param symbol - 例: "BTCUSDT"
 * @param interval - 例: "1h"
 * @param limit - 取得する本数
 * @returns Klineオブジェクト配列
 */
export async function fetchKlines(
  symbol: string,
  interval: string,
  limit = 100,
): Promise<BinanceKlineObject[]> {
  const url = new URL('/api/v3/klines', BASE_URL);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('limit', String(limit));

  const res = await fetchWithTimeout(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch klines: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as BinanceKline[];
  return data.map(klineTupleToObject);
}
