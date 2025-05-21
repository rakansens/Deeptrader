jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { evaluationTool } from '@/mastra/tools/evaluationTool';

describe('evaluationTool', () => {
  it('validates input schema', () => {
    expect(() =>
      evaluationTool.inputSchema!.parse({ query: 'test', result: 'result text' })
    ).not.toThrow();
  });

  it('returns quality score', async () => {
    const context = { query: 'hello', result: 'hello world' };
    const expectedQuality = context.result.length / (context.query.length + context.result.length);
    // executeメソッドが存在することを保証
    const execute = evaluationTool.execute as (params: any) => Promise<any>;
    const result = await execute({ context } as any);
    expect(result).toEqual({ quality: expectedQuality });
  });
});
