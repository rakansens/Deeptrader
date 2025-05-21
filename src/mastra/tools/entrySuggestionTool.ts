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
    timeframe: z.enum(['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M']).describe('時間枠'),
    period: z.number().optional().describe('取得するバー数'),
  }),
  execute: async ({ context }) => {
    const limit = context.period ?? 50;
    try {
      const klinesObj = await fetchKlines(
        context.symbol,
        context.timeframe,
        limit,
      );
      
      // オブジェクト形式の配列から数値と文字列の配列に変換
      const klines: BinanceKline[] = klinesObj.map(k => [
        k.openTime,
        k.open,
        k.high,
        k.low,
        k.close,
        k.volume,
        k.closeTime,
        k.quoteAssetVolume,
        k.tradeCount,
        k.takerBuyBaseVolume,
        k.takerBuyQuoteVolume,
        k.ignore
      ]);
      
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
