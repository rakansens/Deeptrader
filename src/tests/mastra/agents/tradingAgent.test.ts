jest.mock('@mastra/core/agent', () => ({
  Agent: class {
    name!: string;
    instructions!: string;
    tools: any;
    memory: any;
    constructor(config: any) {
      Object.assign(this, config);
    }
    getMemory() {
      return this.memory;
    }
  }
}), { virtual: true });

jest.mock('@mastra/memory', () => ({
  Memory: class {
    constructor(public opts: any) {}
  }
}), { virtual: true });

jest.mock('@ai-sdk/openai', () => ({ 
  openai: (model: string) => `openai-${model}` 
}), { virtual: true });

jest.mock('@/lib/env', () => ({
  AI_MODEL: 'gpt-4o'
}), { virtual: true });

jest.mock('@/mastra/adapters/SupabaseVector', () => ({
  SupabaseVector: {}
}), { virtual: true });

jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { tradingAgent, marketAnalysisSchema, tradingStrategySchema } from '@/mastra/agents/tradingAgent';
import { chartAnalysisTool } from '@/mastra/tools/chartAnalysisTool';
import { marketDataTool } from '@/mastra/tools/marketDataTool';
import { tradingExecutionTool } from '@/mastra/tools/tradingExecutionTool';
import { entrySuggestionTool } from '@/mastra/tools/entrySuggestionTool';

describe('tradingAgent', () => {
  it('is configured correctly', () => {
    expect(tradingAgent.name).toBe('トレーディングアドバイザー');
    expect(tradingAgent.instructions).toContain('暗号資産トレーディングの専門家');
    expect(tradingAgent.tools.chartAnalysisTool).toBe(chartAnalysisTool);
    expect(tradingAgent.tools.marketDataTool).toBe(marketDataTool);
    expect(tradingAgent.tools.tradingExecutionTool).toBe(tradingExecutionTool);
    expect(tradingAgent.tools.entrySuggestionTool).toBe(entrySuggestionTool);
    expect(tradingAgent.getMemory()).toBeDefined();
  });

  it('rejects invalid timeframe in marketAnalysisSchema', () => {
    expect(() =>
      marketAnalysisSchema.parse({
        trend: 'bullish',
        supportLevels: [50000],
        resistanceLevels: [60000],
        keyPatterns: ['ascending triangle'],
        riskLevel: 'medium',
        timeframe: 'invalid',
        summary: 'Test summary',
      })
    ).toThrow();
  });

  it('accepts valid timeframe in tradingStrategySchema', () => {
    expect(() =>
      tradingStrategySchema.parse({
        action: 'buy',
        timeframe: '1h',
        reasoning: 'Test reasoning',
      })
    ).not.toThrow();
  });
});
