jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { chartAnalysisTool } from '@/mastra/tools/chartAnalysisTool';
import { SYMBOLS, TIMEFRAMES } from '@/constants/chart';

describe('chartAnalysisTool', () => {
  it('validates input schema', () => {
    expect(() =>
      chartAnalysisTool.inputSchema.parse({
        symbol: SYMBOLS[0].value,
        timeframe: TIMEFRAMES[3],
      })
    ).not.toThrow();
  });

  it('returns analysis object', async () => {
    const result = await chartAnalysisTool.execute({
      context: { symbol: SYMBOLS[0].value, timeframe: TIMEFRAMES[3] },
    });
    expect(result).toHaveProperty('symbol', SYMBOLS[0].value);
    expect(result).toHaveProperty('timeframe', TIMEFRAMES[3]);
    expect(result).toHaveProperty('analysisTimestamp');
  });
});
