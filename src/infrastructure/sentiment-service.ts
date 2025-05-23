// src/infrastructure/sentiment-service.ts
import { logger } from '@/lib/logger';
import { serverEnv } from '@/config/server';
import { fetchWithTimeout } from '@/lib/fetch';
import type { SentimentMetrics } from "@/types";

const BASE_URL = serverEnv.SENTIMENT_API_URL;
const API_KEY = serverEnv.SENTIMENT_API_KEY;

/**
 * Fear & Greed Index APIからセンチメント指標を取得する
 * @param symbol - 例: BTCUSDT
 */
export async function fetchSentiment(symbol: string): Promise<SentimentMetrics> {
  const url = `${BASE_URL}?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}&limit=1`;
  logger.debug('fetchSentiment url:', url);
  const res = await fetchWithTimeout(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch sentiment: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const item = data.data?.[0] ?? {};

  return {
    score: Number(item.value ?? 0),
    valueText: item.value_classification ?? '',
    timestamp: item.timestamp
      ? new Date(Number(item.timestamp) * 1000).toISOString()
      : new Date().toISOString()
  };
}
