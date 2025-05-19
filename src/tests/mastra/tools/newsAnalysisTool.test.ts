jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { newsAnalysisTool } from '@/mastra/tools/newsAnalysisTool';

describe('newsAnalysisTool', () => {
  it('validates input schema', () => {
    expect(() => newsAnalysisTool.inputSchema!.parse({ query: 'bitcoin' })).not.toThrow();
  });

  it('returns dummy news summary', async () => {
    const result = await newsAnalysisTool.execute({ context: { query: 'bitcoin' } } as any);
    expect(result).toEqual({
      headline: 'bitcoin に関する最新ニュース',
      summary: 'この機能はまだ開発中です'
    });
  });
});
