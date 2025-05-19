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

jest.mock('@ai-sdk/openai', () => ({ openai: () => 'openai' }), { virtual: true });

jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { researchAgent } from '@/mastra/agents/researchAgent';
import { newsAnalysisTool } from '@/mastra/tools/newsAnalysisTool';
import { onChainDataTool } from '@/mastra/tools/onChainDataTool';
import { marketSentimentTool } from '@/mastra/tools/marketSentimentTool';

describe('researchAgent', () => {
  it('is configured correctly', () => {
    expect(researchAgent.name).toBe('市場リサーチスペシャリスト');
    expect(researchAgent.tools.newsAnalysisTool).toBe(newsAnalysisTool);
    expect(researchAgent.tools.onChainDataTool).toBe(onChainDataTool);
    expect(researchAgent.tools.marketSentimentTool).toBe(marketSentimentTool);
    expect(researchAgent.getMemory()).toBeDefined();
  });
});
