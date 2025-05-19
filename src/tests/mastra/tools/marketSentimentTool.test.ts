jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { marketSentimentTool } from '@/mastra/tools/marketSentimentTool';
import { SYMBOLS } from '@/constants/chart';

describe('marketSentimentTool', () => {
  it('validates input schema', () => {
    expect(() =>
      marketSentimentTool.inputSchema.parse({ symbol: SYMBOLS[0].value })
    ).not.toThrow();
  });

  it('returns placeholder sentiment', async () => {
    const result = await marketSentimentTool.execute({ context: { symbol: SYMBOLS[0].value } });
    expect(result).toEqual({ symbol: SYMBOLS[0].value, sentiment: 'neutral', message: 'センチメント分析は未実装です' });
  });
});
