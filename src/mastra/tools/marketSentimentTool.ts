// src/mastra/tools/marketSentimentTool.ts
// 市場センチメント分析ツール
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

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
    return {
      symbol: context.symbol,
      sentiment: 'neutral',
      message: 'センチメント分析は未実装です'
    };
  }
});
