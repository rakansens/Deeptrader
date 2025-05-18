jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { marketSentimentTool } from '@/mastra/tools/marketSentimentTool';

describe('marketSentimentTool', () => {
  it('validates input schema', () => {
    expect(() => marketSentimentTool.inputSchema.parse({ symbol: 'BTCUSDT' })).not.toThrow();
  });

  it('returns placeholder sentiment', async () => {
    const result = await marketSentimentTool.execute({ context: { symbol: 'BTCUSDT' } });
    expect(result).toEqual({ symbol: 'BTCUSDT', sentiment: 'neutral', message: 'センチメント分析は未実装です' });
  });
});
