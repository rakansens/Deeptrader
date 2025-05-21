jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { marketDataTool } from '@/mastra/tools/marketDataTool';
import { getTicker } from '@/infrastructure/exchange/bitget-service';
import { SYMBOLS } from '@/constants/chart';

jest.mock('@/infrastructure/exchange/bitget-service');

describe('marketDataTool', () => {
  it('validates input schema', () => {
    expect(() =>
      marketDataTool.inputSchema!.parse({ symbol: SYMBOLS[0].value })
    ).not.toThrow();
  });

  it('executes and returns ticker', async () => {
    const mockTicker = {
      symbol: SYMBOLS[0].value,
      high24h: '1',
      low24h: '0',
      last: '0',
      bidPrice: '',
      askPrice: '',
      volume24h: '',
      timestamp: ''
    };
    (getTicker as jest.Mock).mockResolvedValue(mockTicker);
    // executeメソッドが存在することを保証
    const execute = marketDataTool.execute as (params: any) => Promise<any>;
    const result = await execute({ context: { symbol: SYMBOLS[0].value } } as any);
    expect(getTicker).toHaveBeenCalledWith(SYMBOLS[0].value);
    expect(result).toEqual(mockTicker);
  });
});
