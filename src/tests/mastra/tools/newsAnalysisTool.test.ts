jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { newsAnalysisTool } from '@/mastra/tools/newsAnalysisTool';
import { fetchNewsSummary } from '@/infrastructure/news-service';

jest.mock('@/infrastructure/news-service');

describe('newsAnalysisTool', () => {
  it('validates input schema', () => {
    expect(() => newsAnalysisTool.inputSchema!.parse({ query: 'bitcoin' })).not.toThrow();
  });

  it('fetches news summary', async () => {
    (fetchNewsSummary as jest.Mock).mockResolvedValue({
      headline: 'Example',
      summary: 'summary',
      url: 'https://example.com'
    });
    const result = await newsAnalysisTool.execute({ context: { query: 'bitcoin' } } as any);
    expect(fetchNewsSummary).toHaveBeenCalledWith('bitcoin');
    expect(result).toEqual({
      headline: 'Example',
      summary: 'summary',
      url: 'https://example.com'
    });
  });
});
