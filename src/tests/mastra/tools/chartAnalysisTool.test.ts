jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { chartAnalysisTool } from '@/mastra/tools/chartAnalysisTool';
import { fetchKlines } from '@/infrastructure/exchange/binance-service';
import { computeSMA, computeRSI, computeMACD, computeBollinger } from '@/lib/indicators';
import type { BinanceKline } from '@/types/binance';
import { SYMBOLS, TIMEFRAMES } from '@/constants/chart';

jest.mock('@/infrastructure/exchange/binance-service');

describe('chartAnalysisTool', () => {
  const sample: BinanceKline[] = Array.from({ length: 40 }, (_, i) => [
    i,
    '',
    '',
    '',
    String(i + 1),
    '',
    i,
    '',
    0,
    '',
    '',
    ''
  ]) as BinanceKline[];

  it('validates input schema', () => {
    expect(() =>
      chartAnalysisTool.inputSchema.parse({
        symbol: SYMBOLS[0].value,
        timeframe: TIMEFRAMES[3]
      })
    ).not.toThrow();
  });

  it('computes indicators from fetched data', async () => {
    (fetchKlines as jest.Mock).mockResolvedValue(sample);
    const result = await chartAnalysisTool.execute({
      context: {
        symbol: SYMBOLS[0].value,
        timeframe: TIMEFRAMES[3],
        indicators: ['SMA', 'RSI', 'MACD', 'Bollinger'],
        patternDetection: false,
        period: 40
      }
    });
    const closes = sample.map((k) => parseFloat(k[4]));
    const expectedMacd = computeMACD(closes)!;
    const expectedBoll = computeBollinger(closes)!;
    expect(result.indicators).toEqual([
      { name: 'SMA', value: computeSMA(closes, 14)! },
      { name: 'RSI', value: computeRSI(closes, 14)! },
      {
        name: 'MACD',
        macd: expectedMacd.macd,
        signal: expectedMacd.signal,
        histogram: expectedMacd.histogram
      },
      { name: 'Bollinger', upper: expectedBoll.upper, lower: expectedBoll.lower }
    ]);
    expect(result.patterns).toEqual([]);
  });

  it('throws error when fetch fails', async () => {
    (fetchKlines as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect(
      chartAnalysisTool.execute({
        context: { symbol: SYMBOLS[0].value, timeframe: TIMEFRAMES[3] }
      })
    ).rejects.toThrow('ローソク足データの取得に失敗しました');
  });
});
