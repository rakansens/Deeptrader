// src/infrastructure/sentiment-service.ts
import { logger } from '@/lib/logger';

export interface SentimentMetrics {
  /** 数値化されたセンチメントスコア (0-100) */
  score: number;
  /** APIが提供する追加情報 */
  valueText?: string;
  /** データ取得時刻 */
  timestamp: string;
}

const BASE_URL = process.env.SENTIMENT_API_URL ?? 'https://api.alternative.me/fng/';
const API_KEY = process.env.SENTIMENT_API_KEY ?? '';

/**
 * Fear & Greed Index APIからセンチメント指標を取得する
 * @param symbol - 例: BTCUSDT
 */
export async function fetchSentiment(symbol: string): Promise<SentimentMetrics> {
  const url = `${BASE_URL}?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}&limit=1`;
  logger.debug('fetchSentiment url:', url);
  const res = await fetch(url);

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
