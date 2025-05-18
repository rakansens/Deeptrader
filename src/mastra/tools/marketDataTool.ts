// src/mastra/tools/marketDataTool.ts
// 市場データ取得ツール
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getTicker } from '@/infrastructure/exchange/bitget-service';

/**
 * 市場データツール
 * 指定したシンボルのティッカー情報を取得する
 */
export const marketDataTool = createTool({
  id: 'market-data-tool',
  description: 'Bitgetから市場データを取得します',
  inputSchema: z.object({
    symbol: z.string().describe('例: BTCUSDT')
  }),
  execute: async ({ context }) => {
    const ticker = await getTicker(context.symbol);
    return ticker;
  }
});
