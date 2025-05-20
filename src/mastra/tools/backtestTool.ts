// src/mastra/tools/backtestTool.ts
// 簡易バックテストツール
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { fetchKlines } from '@/infrastructure/exchange/binance-service';
import { computeSMA } from '@/lib/indicators';
import { TIMEFRAMES } from '@/constants/chart';
import type { BinanceKline } from '@/types/binance';

/**
 * 単純移動平均のクロスオーバー戦略でバックテストを行う
 */
export const backtestTool = createTool({
  id: 'backtest-tool',
  description: '過去データを用いてSMAクロスオーバーの簡易バックテストを実行します',
  inputSchema: z.object({
    symbol: z.string().describe('例: BTCUSDT'),
    timeframe: z.enum(TIMEFRAMES).describe('時間枠'),
    shortPeriod: z.number().default(5).describe('短期SMA期間'),
    longPeriod: z.number().default(20).describe('長期SMA期間'),
    initialBalance: z.number().default(1000).describe('初期資金'),
    limit: z.number().optional().describe('取得するローソク足数'),
  }),
  execute: async ({ context }) => {
    const {
      symbol,
      timeframe,
      shortPeriod,
      longPeriod,
      initialBalance,
      limit = 200,
    } = context;

    logger.debug('バックテスト開始', context);

    let klines: BinanceKline[];
    try {
      klines = await fetchKlines(symbol, timeframe, limit);
    } catch (err) {
      logger.error('failed to fetch klines', err);
      throw new Error('ローソク足データの取得に失敗しました');
    }

    const closes = klines.map((k) => parseFloat(k[4]));
    let balance = initialBalance;
    let position: number | null = null;
    let trades = 0;

    const sma = (arr: number[], period: number) => computeSMA(arr, period);

    for (let i = 0; i < closes.length; i++) {
      const slice = closes.slice(0, i + 1);
      const short = sma(slice, shortPeriod);
      const long = sma(slice, longPeriod);
      const prevShort = sma(slice.slice(0, -1), shortPeriod);
      const prevLong = sma(slice.slice(0, -1), longPeriod);
      if (
        short === null ||
        long === null ||
        prevShort === null ||
        prevLong === null
      )
        continue;

      if (position === null) {
        if (prevShort <= prevLong && short > long) {
          position = closes[i];
          trades += 1;
        }
      } else if (prevShort >= prevLong && short < long) {
        balance *= closes[i] / position;
        position = null;
      }
    }

    if (position !== null) {
      balance *= closes[closes.length - 1] / position;
    }

    const profit = balance - initialBalance;
    const returnPct = (balance / initialBalance - 1) * 100;

    return {
      symbol,
      timeframe,
      trades,
      finalBalance: balance,
      profit,
      returnPct,
    };
  },
});
