// src/mastra/tools/chartAnalysisTool.ts
// チャート分析ツールの実装
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { fetchKlines } from '@/infrastructure/exchange/binance-service';
import { computeSMA, computeRSI, computeMACD, computeBollinger } from '@/lib/indicators';
import { TIMEFRAMES } from '@/constants/chart';
import type { BinanceKline } from '@/types/binance';

/** 価格配列からダブルトップを検出 */
function detectDoubleTop(prices: number[]): boolean {
  if (prices.length < 5) return false;
  const [a, b, c, d, e] = prices.slice(-5);
  const tolerance = 0.01;
  return b > a && c < b && d > c && Math.abs(b - d) / b < tolerance && e < d;
}

/** 価格配列からダブルボトムを検出 */
function detectDoubleBottom(prices: number[]): boolean {
  if (prices.length < 5) return false;
  const [a, b, c, d, e] = prices.slice(-5);
  const tolerance = 0.01;
  return b < a && c > b && d < c && Math.abs(b - d) / b < tolerance && e > d;
}

/**
 * チャート分析ツール
 * Binanceから価格データを取得してテクニカル分析を行う
 */
export const chartAnalysisTool = createTool({
  id: 'chart-analysis-tool',
  description: '暗号資産のチャートを分析し、パターンや指標に基づいた洞察を提供します',

  inputSchema: z.object({
    symbol: z.string().describe('分析する暗号資産のシンボル (例: BTCUSDT)'),
    timeframe: z.enum(TIMEFRAMES).describe(
      '時間枠 (例: 1m, 5m, 15m, 1h, 4h, 1d)',
    ),
    indicators: z
      .array(z.string())
      .optional()
      .describe("計算するテクニカル指標のリスト (例: ['RSI', 'MACD', 'Bollinger'])"),
    patternDetection: z.boolean().optional().describe('チャートパターン検出を実行するかどうか'),
    period: z.number().optional().describe('分析する期間（バー数）'),
  }),

  execute: async ({ context }) => {
    logger.debug('チャート分析ツール実行:', context);
    const {
      symbol,
      timeframe,
      indicators = ['SMA', 'RSI', 'MACD', 'Bollinger'],
      patternDetection = false,
      period = 100,
    } = context;

    let klines: BinanceKline[];
    try {
      klines = await fetchKlines(symbol, timeframe, period);
    } catch (err) {
      logger.error('failed to fetch klines', err);
      throw new Error('ローソク足データの取得に失敗しました');
    }

    const closes = klines.map((k) => parseFloat(k[4]));
    const results: any[] = [];
    for (const ind of indicators) {
      const name = ind.toUpperCase();
      if (name === 'SMA') {
        const value = computeSMA(closes, 14);
        if (value !== null) results.push({ name: 'SMA', value });
      } else if (name === 'RSI') {
        const value = computeRSI(closes, 14);
        if (value !== null) results.push({ name: 'RSI', value });
      } else if (name === 'MACD') {
        const macd = computeMACD(closes);
        if (macd) {
          results.push({ name: 'MACD', macd: macd.macd, signal: macd.signal, histogram: macd.histogram });
        }
      } else if (name === 'BOLLINGER' || name === 'BOLLINGERBANDS' || name === 'BOLLINGER_BANDS') {
        const band = computeBollinger(closes);
        if (band) results.push({ name: 'Bollinger', upper: band.upper, lower: band.lower });
      }
    }

    const patterns: string[] = [];
    if (patternDetection) {
      if (detectDoubleTop(closes)) patterns.push('DoubleTop');
      if (detectDoubleBottom(closes)) patterns.push('DoubleBottom');
    }

    return {
      symbol,
      timeframe,
      analysisTimestamp: new Date().toISOString(),
      period: closes.length,
      indicators: results,
      patterns,
    };
  },
});
