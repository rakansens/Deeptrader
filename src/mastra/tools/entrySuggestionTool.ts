// src/mastra/tools/entrySuggestionTool.ts
// エントリー提案ツール
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchKlines } from '@/infrastructure/exchange/binance-service';
import { computeRSI } from '@/lib/indicators';
import { TIMEFRAMES } from '@/constants/chart';
import { logger } from '@/lib/logger';
import type { BinanceKline } from '@/types/binance';

/**
 * RSIを用いてシンプルなエントリーポイントを提案するツール
 */
export const entrySuggestionTool = createTool({
  id: 'entry-suggestion-tool',
  description: 'RSIを利用してエントリー候補を提示します',
  inputSchema: z.object({
    symbol: z.string().describe('例: BTCUSDT'),
    timeframe: z.enum(TIMEFRAMES).describe('時間枠'),
    period: z.number().optional().describe('取得するバー数'),
  }),
  execute: async ({ context }) => {
    const limit = context.period ?? 50;
    try {
      const klines: BinanceKline[] = await fetchKlines(
        context.symbol,
        context.timeframe,
        limit,
      );
      const closes = klines.map((k) => parseFloat(k[4]));
      const rsi = computeRSI(closes, 14);
      const lastPrice = closes[closes.length - 1];
      if (rsi === null) {
        return { action: 'wait', entry: lastPrice, rsi: null } as const;
      }
      if (rsi < 30) {
        return { action: 'buy', entry: lastPrice, rsi } as const;
      }
      if (rsi > 70) {
        return { action: 'sell', entry: lastPrice, rsi } as const;
      }
      return { action: 'wait', entry: lastPrice, rsi } as const;
    } catch (err) {
      logger.error('entry suggestion failed', err);
      throw new Error('エントリー提案に失敗しました');
    }
  },
});
