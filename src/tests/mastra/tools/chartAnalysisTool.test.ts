jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { chartAnalysisTool } from '@/mastra/tools/chartAnalysisTool';

describe('chartAnalysisTool', () => {
  it('validates input schema', () => {
    expect(() => chartAnalysisTool.inputSchema.parse({ symbol: 'BTCUSDT', timeframe: '1h' })).not.toThrow();
  });

  it('returns analysis object', async () => {
    const result = await chartAnalysisTool.execute({ context: { symbol: 'BTCUSDT', timeframe: '1h' } });
    expect(result).toHaveProperty('symbol', 'BTCUSDT');
    expect(result).toHaveProperty('timeframe', '1h');
    expect(result).toHaveProperty('analysisTimestamp');
  });
});
