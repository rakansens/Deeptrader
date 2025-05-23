import { serverEnv } from '@/config/server';
import { fetchWithTimeout } from '@/lib/fetch';
import type { NewsArticle } from "@/types";

const API_KEY = serverEnv.NEWS_API_KEY;
const API_URL = serverEnv.NEWS_API_URL;

/**
 * 外部ニュースAPIから記事を取得し、要約を返す
 * @param query - 検索キーワード
 */
export async function fetchNewsSummary(query: string): Promise<NewsArticle> {
  const url = new URL(API_URL);
  url.searchParams.set('q', query);
  if (API_KEY) {
    url.searchParams.set('apiKey', API_KEY);
  }

  const res = await fetchWithTimeout(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch news: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const article = data.articles?.[0];
  if (!article) {
    throw new Error('No news articles found');
  }

  return {
    headline: article.title ?? '',
    summary: article.description ?? '',
    url: article.url ?? ''
  };
}

