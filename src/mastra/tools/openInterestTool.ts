// src/mastra/tools/openInterestTool.ts
// オープンインタレスト取得ツール
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchOpenInterest } from '@/infrastructure/open-interest-service';

/**
 * オープンインタレストツール
 * 指定したシンボルのオープンインタレストデータを取得する
 */
export const openInterestTool = createTool({
  id: 'open-interest-tool',
  description: 'Coinglassからオープンインタレストを取得します',
  inputSchema: z.object({
    symbol: z.string().describe('例: BTCUSDT')
  }),
  execute: async ({ context }) => {
    const data = await fetchOpenInterest(context.symbol);
    return data;
  }
});
