// src/mastra/tools/marketSentimentTool.ts
// 市場センチメント分析ツール
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchSentiment } from '@/infrastructure/sentiment-service';

/**
 * SNSなどから市場センチメントを評価するダミーツール
 */
export const marketSentimentTool = createTool({
  id: 'market-sentiment-tool',
  description: '市場センチメントを分析します',
  inputSchema: z.object({
    symbol: z.string().describe('例: BTCUSDT')
  }),
  execute: async ({ context }) => {
    const metrics = await fetchSentiment(context.symbol);

    let sentiment: 'bullish' | 'bearish' | 'neutral';
    if (metrics.score >= 60) {
      sentiment = 'bullish';
    } else if (metrics.score <= 40) {
      sentiment = 'bearish';
    } else {
      sentiment = 'neutral';
    }

    return {
      symbol: context.symbol,
      score: metrics.score,
      sentiment
    };
  }
});
