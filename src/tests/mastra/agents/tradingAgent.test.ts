jest.mock('@mastra/core/agent', () => ({
  Agent: class {
    name: string;
    instructions: string;
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

jest.mock('@ai-sdk/openai', () => ({ openai: () => 'openai' }), { virtual: true });

jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { tradingAgent } from '@/mastra/agents/tradingAgent';
import { chartAnalysisTool } from '@/mastra/tools/chartAnalysisTool';
import { marketDataTool } from '@/mastra/tools/marketDataTool';
import { tradingExecutionTool } from '@/mastra/tools/tradingExecutionTool';

describe('tradingAgent', () => {
  it('is configured correctly', () => {
    expect(tradingAgent.name).toBe('トレーディングアドバイザー');
    expect(tradingAgent.tools.chartAnalysisTool).toBe(chartAnalysisTool);
    expect(tradingAgent.tools.marketDataTool).toBe(marketDataTool);
    expect(tradingAgent.tools.tradingExecutionTool).toBe(tradingExecutionTool);
    expect(tradingAgent.getMemory()).toBeDefined();
  });
});
