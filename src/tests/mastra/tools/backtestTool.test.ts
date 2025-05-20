jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { backtestTool } from '@/mastra/tools/backtestTool';
import { fetchKlines } from '@/infrastructure/exchange/binance-service';
import { SYMBOLS, TIMEFRAMES } from '@/constants/chart';
import type { BinanceKline } from '@/types/binance';

// 戻り値の型を定義
interface BacktestResult {
  symbol: string;
  timeframe: string;
  trades: number;
  finalBalance: number;
  profit: number;
  returnPct: number;
}

jest.mock('@/infrastructure/exchange/binance-service');

describe('backtestTool', () => {
  const sample: BinanceKline[] = [
    ...[1,2,3,4,5,4,3,2,1,2,3,4,5].map((c,i) => [
      i,
      '',
      '',
      '',
      String(c),
      '',
      i,
      '',
      0,
      '',
      '',
      ''
    ])
  ] as BinanceKline[];

  it('validates input schema', () => {
    expect(() =>
      backtestTool.inputSchema!.parse({
        symbol: SYMBOLS[0].value,
        timeframe: TIMEFRAMES[0],
      })
    ).not.toThrow();
  });

  it('runs backtest and returns result', async () => {
    (fetchKlines as jest.Mock).mockResolvedValue(sample);
    const result = await backtestTool.execute({
      context: {
        symbol: SYMBOLS[0].value,
        timeframe: TIMEFRAMES[0],
        shortPeriod: 3,
        longPeriod: 5,
        initialBalance: 1000,
        limit: sample.length,
      }
    } as any) as BacktestResult;
    
    expect(fetchKlines).toHaveBeenCalledWith(
      SYMBOLS[0].value,
      TIMEFRAMES[0],
      sample.length
    );
    expect(result.trades).toBe(1);
    expect(result.finalBalance).toBeCloseTo(1250);
    expect(result.returnPct).toBeCloseTo(25);
  });

  it('throws error when fetch fails', async () => {
    (fetchKlines as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect(
      backtestTool.execute({
        context: { symbol: SYMBOLS[0].value, timeframe: TIMEFRAMES[0] }
      } as any)
    ).rejects.toThrow('ローソク足データの取得に失敗しました');
  });
});
