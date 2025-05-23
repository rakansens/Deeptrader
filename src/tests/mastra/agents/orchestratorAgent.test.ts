jest.mock('@mastra/core/agent', () => ({
  Agent: class {
    name!: string;
    instructions!: string;
    model: any;
    constructor(config: any) {
      Object.assign(this, config);
    }
  }
}), { virtual: true });

jest.mock('@ai-sdk/openai', () => ({ 
  openai: (model: string) => `openai-${model}` 
}), { virtual: true });

jest.mock('@/lib/env.server', () => ({
  AI_MODEL: 'gpt-4o'
}), { virtual: true });

import {
  orchestratorAgent,
} from '@/mastra/agents/orchestratorAgent';

describe('orchestratorAgent', () => {
  it('is configured correctly', () => {
    expect(orchestratorAgent.name).toBe('オーケストラエージェント');
    expect(orchestratorAgent.instructions).toContain('Deeptrader');
    expect(orchestratorAgent.model).toBe('openai-gpt-4o');
  });
  
  it('has basic trading assistant instructions', () => {
    expect(orchestratorAgent.instructions).toContain('トレーディング');
    expect(orchestratorAgent.instructions).toContain('投資');
    expect(orchestratorAgent.instructions).toContain('基本機能');
  });
});
