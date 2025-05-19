jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { tradingExecutionTool } from '@/mastra/tools/tradingExecutionTool';
import { placeOrder } from '@/infrastructure/exchange/bitget-service';
import { SYMBOLS } from '@/constants/chart';

jest.mock('@/infrastructure/exchange/bitget-service');

describe('tradingExecutionTool', () => {
  it('validates input schema', () => {
    expect(() =>
      tradingExecutionTool.inputSchema!.parse({
        symbol: SYMBOLS[0].value,
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 100
      })
    ).not.toThrow();
  });

  it('calls placeOrder and returns success', async () => {
    (placeOrder as jest.Mock).mockResolvedValue(undefined);
    const context = {
      symbol: SYMBOLS[0].value,
      side: 'buy',
      type: 'limit',
      quantity: 1,
      price: 100
    };
    const result = await tradingExecutionTool.execute({ context } as any);
    expect(placeOrder).toHaveBeenCalledWith(context);
    expect(result).toEqual({ success: true });
  });
});
