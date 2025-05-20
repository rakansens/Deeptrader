import type { BinanceKline, BinanceKlineObject } from '@/types/binance';
import type { OrderBookEntry } from '@/types';
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

/**
 * オーダーブックを取得する
 * @param symbol - 例: "BTCUSDT"
 * @param limit - 取得する深さ (デフォルト20)
 * @returns bidsとasks
 */
export async function fetchOrderBook(
  symbol: string,
  limit = 20,
): Promise<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] }> {
  const url = new URL('/api/v3/depth', BASE_URL)
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('limit', String(limit))

  const res = await fetchWithTimeout(url.toString())
  if (!res.ok) {
    throw new Error(`Failed to fetch order book: ${res.status} ${res.statusText}`)
  }
  const data = (await res.json()) as { bids: [string, string][]; asks: [string, string][] }
  const bids = data.bids.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }))
  const asks = data.asks.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }))
  return { bids, asks }
}
