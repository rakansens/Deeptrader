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

import { backtestAgent } from '@/mastra/agents/backtestAgent';
import { backtestTool } from '@/mastra/tools/backtestTool';

describe('backtestAgent', () => {
  it('is configured correctly', () => {
    expect(backtestAgent.name).toBe('バックテストエージェント');
    expect(backtestAgent.tools.backtestTool).toBe(backtestTool);
    expect(backtestAgent.getMemory()).toBeDefined();
  });
});
