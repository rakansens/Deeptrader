jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { marketDataTool } from '@/mastra/tools/marketDataTool';
import { getTicker } from '@/infrastructure/exchange/bitget-service';

jest.mock('@/infrastructure/exchange/bitget-service');

describe('marketDataTool', () => {
  it('validates input schema', () => {
    expect(() => marketDataTool.inputSchema.parse({ symbol: 'BTCUSDT' })).not.toThrow();
  });

  it('executes and returns ticker', async () => {
    const mockTicker = {
      symbol: 'BTCUSDT',
      high24h: '1',
      low24h: '0',
      last: '0',
      bidPrice: '',
      askPrice: '',
      volume24h: '',
      timestamp: ''
    };
    (getTicker as jest.Mock).mockResolvedValue(mockTicker);
    const result = await marketDataTool.execute({ context: { symbol: 'BTCUSDT' } });
    expect(getTicker).toHaveBeenCalledWith('BTCUSDT');
    expect(result).toEqual(mockTicker);
  });
});
