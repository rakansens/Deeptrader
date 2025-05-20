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

import {
  orchestratorAgent,
  delegateTradingTool,
  delegateResearchTool,
  delegateUiControlTool,
  delegateBacktestTool,
} from '@/mastra/agents/orchestratorAgent';

describe('orchestratorAgent', () => {
  it('is configured correctly', () => {
    expect(orchestratorAgent.name).toBe('オーケストラエージェント');
    expect(orchestratorAgent.tools.delegateTradingTool).toBe(delegateTradingTool);
    expect(orchestratorAgent.tools.delegateResearchTool).toBe(delegateResearchTool);
    expect(orchestratorAgent.tools.delegateUiControlTool).toBe(delegateUiControlTool);
    expect(orchestratorAgent.tools.delegateBacktestTool).toBe(delegateBacktestTool);
    expect(orchestratorAgent.getMemory()).toBeDefined();
  });
});
