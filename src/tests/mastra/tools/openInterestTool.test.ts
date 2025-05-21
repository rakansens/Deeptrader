jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { openInterestTool } from '@/mastra/tools/openInterestTool';
import { fetchOpenInterest } from '@/infrastructure/open-interest-service';
import { SYMBOLS } from '@/constants/chart';

jest.mock('@/infrastructure/open-interest-service');

describe('openInterestTool', () => {
  it('validates input schema', () => {
    expect(() => openInterestTool.inputSchema!.parse({ symbol: SYMBOLS[0].value })).not.toThrow();
  });

  it('executes and returns open interest data', async () => {
    const mockData = {
      symbol: SYMBOLS[0].value,
      price: 100,
      sumOpenInterestValue: 12345,
      timestamp: '2024-01-01T00:00:00Z'
    };
    (fetchOpenInterest as jest.Mock).mockResolvedValue(mockData);
    // executeメソッドが存在することを保証
    const execute = openInterestTool.execute as (params: any) => Promise<any>;
    const result = await execute({ context: { symbol: SYMBOLS[0].value } } as any);
    expect(fetchOpenInterest).toHaveBeenCalledWith(SYMBOLS[0].value);
    expect(result).toEqual(mockData);
  });
});
