import { serverEnv } from '@/config/server';
import { fetchWithTimeout } from '@/lib/fetch';
import type { OpenInterestData } from "@/types";

/**
 * オープンインタレストデータサービス
 * Coinglassからオープンインタレストデータを取得
 */

const BASE_URL = serverEnv.COINGLASS_BASE_URL;
const API_KEY = serverEnv.COINGLASS_API_KEY;

/**
 * Coinglass APIからオープンインタレストを取得
 * @param symbol - 例: BTCUSDT
 */
export async function fetchOpenInterest(symbol: string): Promise<OpenInterestData> {
  const url = `${BASE_URL}/futures/open_interest?symbol=${encodeURIComponent(symbol)}`;
  const headers: Record<string, string> = {};
  if (API_KEY) {
    headers.coinglassSecret = API_KEY;
  }
  const res = await fetchWithTimeout(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch open interest: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const item = data.data?.[0] ?? {};
  return {
    symbol: item.symbol ?? symbol,
    price: Number(item.price ?? 0),
    sumOpenInterestValue: Number(item.sumOpenInterestValue ?? 0),
    timestamp: item.timestamp
      ? new Date(Number(item.timestamp)).toISOString()
      : new Date().toISOString(),
  };
}
