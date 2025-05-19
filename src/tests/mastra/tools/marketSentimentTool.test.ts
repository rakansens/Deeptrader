jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { marketSentimentTool } from '@/mastra/tools/marketSentimentTool';
import { SYMBOLS } from '@/constants/chart';
import { fetchSentiment } from '@/infrastructure/sentiment-service';

jest.mock('@/infrastructure/sentiment-service');

describe('marketSentimentTool', () => {
  it('validates input schema', () => {
    expect(() =>
      marketSentimentTool.inputSchema.parse({ symbol: SYMBOLS[0].value })
    ).not.toThrow();
  });

  it('fetches sentiment and returns score', async () => {
    (fetchSentiment as jest.Mock).mockResolvedValue({ score: 70, timestamp: '2024-01-01T00:00:00Z' });
    const result = await marketSentimentTool.execute({ context: { symbol: SYMBOLS[0].value } });
    expect(fetchSentiment).toHaveBeenCalledWith(SYMBOLS[0].value);
    expect(result).toEqual({ symbol: SYMBOLS[0].value, score: 70, sentiment: 'bullish' });
  });
});
