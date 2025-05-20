import { NEWS_API_KEY, NEWS_API_URL } from '@/lib/env';
import { fetchWithTimeout } from '@/lib/fetch';

export interface NewsArticle {
  headline: string;
  summary: string;
  url: string;
}

/**
 * 外部ニュースAPIから記事を取得し、要約を返す
 * @param query - 検索キーワード
 */
export async function fetchNewsSummary(query: string): Promise<NewsArticle> {
  const url = new URL(NEWS_API_URL);
  url.searchParams.set('q', query);
  if (NEWS_API_KEY) {
    url.searchParams.set('apiKey', NEWS_API_KEY);
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

