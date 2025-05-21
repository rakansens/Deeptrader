jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { entrySuggestionTool } from '@/mastra/tools/entrySuggestionTool';
import { fetchKlines } from '@/infrastructure/exchange/binance-service';
import { computeRSI } from '@/lib/indicators';
import { SYMBOLS, TIMEFRAMES } from '@/constants/chart';
import type { BinanceKline } from '@/types/binance';

jest.mock('@/infrastructure/exchange/binance-service');

const toKlines = (closes: number[]): BinanceKline[] =>
  closes.map((c, i) => [
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
  ]) as BinanceKline[];

describe('entrySuggestionTool', () => {
  it('validates input schema', () => {
    expect(() =>
      entrySuggestionTool.inputSchema!.parse({
        symbol: SYMBOLS[0].value,
        timeframe: TIMEFRAMES[0]
      })
    ).not.toThrow();
  });

  it('suggests buy when RSI is low', async () => {
    const closes = Array.from({ length: 50 }, (_, i) => 100 - i);
    (fetchKlines as jest.Mock).mockResolvedValue(toKlines(closes));
    // executeメソッドが存在することを保証
    const execute = entrySuggestionTool.execute as (params: any) => Promise<any>;
    const result = await execute({
      context: { symbol: SYMBOLS[0].value, timeframe: TIMEFRAMES[0] }
    } as any);
    const expectedRsi = computeRSI(closes, 14)!;
    expect(result).toEqual({ action: 'buy', entry: closes[closes.length - 1], rsi: expectedRsi });
  });

  it('suggests sell when RSI is high', async () => {
    const closes = Array.from({ length: 50 }, (_, i) => i + 1);
    (fetchKlines as jest.Mock).mockResolvedValue(toKlines(closes));
    // executeメソッドが存在することを保証
    const execute = entrySuggestionTool.execute as (params: any) => Promise<any>;
    const result = await execute({
      context: { symbol: SYMBOLS[0].value, timeframe: TIMEFRAMES[0] }
    } as any);
    const expectedRsi = computeRSI(closes, 14)!;
    expect(result).toEqual({ action: 'sell', entry: closes[closes.length - 1], rsi: expectedRsi });
  });

  it('returns wait when not enough data', async () => {
    const closes = Array.from({ length: 10 }, (_, i) => i + 1);
    (fetchKlines as jest.Mock).mockResolvedValue(toKlines(closes));
    // executeメソッドが存在することを保証
    const execute = entrySuggestionTool.execute as (params: any) => Promise<any>;
    const result = await execute({
      context: { symbol: SYMBOLS[0].value, timeframe: TIMEFRAMES[0] }
    } as any);
    expect(result).toEqual({ action: 'wait', entry: closes[closes.length - 1], rsi: null });
  });

  it('throws error when fetch fails', async () => {
    (fetchKlines as jest.Mock).mockRejectedValue(new Error('fail'));
    // executeメソッドが存在することを保証
    const execute = entrySuggestionTool.execute as (params: any) => Promise<any>;
    await expect(
      execute({ context: { symbol: SYMBOLS[0].value, timeframe: TIMEFRAMES[0] } } as any)
    ).rejects.toThrow('エントリー提案に失敗しました');
  });
});
