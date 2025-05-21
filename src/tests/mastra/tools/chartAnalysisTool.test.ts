jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test'

import { chartAnalysisTool } from '@/mastra/tools/chartAnalysisTool';
import { fetchKlines } from '@/infrastructure/exchange/binance-service';
import { computeSMA, computeRSI, computeBollinger, computeMACD } from '@/lib/indicators';
import type { BinanceKline, BinanceKlineObject } from '@/types/binance';
import { SYMBOLS, TIMEFRAMES } from '@/constants/chart';

jest.mock('@/infrastructure/exchange/binance-service', () => ({
  fetchKlines: jest.fn(),
}));

describe('chartAnalysisTool', () => {
  const sample: BinanceKlineObject[] = Array.from({ length: 40 }, (_, i) => ({
    openTime: i,
    open: '',
    high: '',
    low: '',
    close: String(i + 1),
    volume: '',
    closeTime: i,
    quoteAssetVolume: '',
    tradeCount: 0,
    takerBuyBaseVolume: '',
    takerBuyQuoteVolume: '',
    ignore: '',
  }));

  it('validates input schema', () => {
    expect(() =>
      chartAnalysisTool.inputSchema!.parse({
        symbol: SYMBOLS[0].value,
        timeframe: TIMEFRAMES[3]
      })
    ).not.toThrow();
  });

  it('computes indicators from fetched data', async () => {
    (fetchKlines as jest.Mock).mockResolvedValue(sample);
    // executeメソッドが存在することを保証
    const execute = chartAnalysisTool.execute as (params: any) => Promise<any>;
    const result = (await execute({
      context: {
        symbol: SYMBOLS[0].value,
        timeframe: TIMEFRAMES[3],
        indicators: ['SMA', 'RSI', 'MACD', 'Bollinger'],
        patternDetection: false,
        period: 40,
        settings: {
          sma: 14,
          rsi: 14,
          macd: { short: 12, long: 26, signal: 9 },
          boll: 20,
        }
      }
    } as any)) as any;
    const closes = sample.map((k) => parseFloat(k.close));
    
    // MACDを計算
    const expectedMacd = computeMACD(closes)!;
    
    const expectedBoll = computeBollinger(closes)!;
    expect(result.indicators).toEqual([
      { name: 'SMA', value: computeSMA(closes, 14)! },
      { name: 'RSI', value: computeRSI(closes, 14)! },
      {
        name: 'MACD',
        macd: expectedMacd!.macd,
        signal: expectedMacd!.signal,
        histogram: expectedMacd!.histogram
      },
      { name: 'Bollinger', upper: expectedBoll.upper, lower: expectedBoll.lower }
    ]);
    expect(result.patterns).toEqual([]);
  });

  it('throws error when fetch fails', async () => {
    (fetchKlines as jest.Mock).mockRejectedValue(new Error('fail'));
    // executeメソッドが存在することを保証
    const execute = chartAnalysisTool.execute as (params: any) => Promise<any>;
    await expect(
      execute({
        context: { symbol: SYMBOLS[0].value, timeframe: TIMEFRAMES[3] }
      } as any)
    ).rejects.toThrow('ローソク足データの取得に失敗しました');
  });
});
