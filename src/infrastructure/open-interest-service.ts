import { COINGLASS_BASE_URL, COINGLASS_API_KEY } from '@/lib/env';
import { fetchWithTimeout } from '@/lib/fetch';

export interface OpenInterestData {
  symbol: string;
  price: number;
  sumOpenInterestValue: number;
  timestamp: string;
}

/**
 * Coinglass APIからオープンインタレストを取得
 * @param symbol - 例: BTCUSDT
 */
export async function fetchOpenInterest(symbol: string): Promise<OpenInterestData> {
  const url = `${COINGLASS_BASE_URL}/futures/open_interest?symbol=${encodeURIComponent(symbol)}`;
  const headers: Record<string, string> = {};
  if (COINGLASS_API_KEY) {
    headers.coinglassSecret = COINGLASS_API_KEY;
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
