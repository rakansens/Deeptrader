jest.mock('@mastra/core/agent', () => ({
  Agent: class {
    name!: string;
    instructions!: string;
    model: any;
    tools: any;
    constructor(config: any) {
      Object.assign(this, config);
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

jest.mock('@/lib/env.server', () => ({
  AI_MODEL: 'gpt-4o'
}), { virtual: true });

jest.mock('@/mastra/adapters/SupabaseVector', () => ({
  SupabaseVector: class {}
}), { virtual: true });

jest.mock('@/mastra/tools/delegationTools', () => ({
  delegateTradingTool: { id: 'delegate_trading', description: 'Trading delegation tool' },
  delegateResearchTool: { id: 'delegate_research', description: 'Research delegation tool' },
  delegateUiControlTool: { id: 'delegate_ui_control', description: 'UI control delegation tool' },
  delegateBacktestTool: { id: 'delegate_backtest', description: 'Backtest delegation tool' },
}), { virtual: true });

import {
  orchestratorAgent,
  delegateTradingTool,
  delegateResearchTool,
  delegateUiControlTool,
  delegateBacktestTool,
} from '@/mastra/agents/orchestratorAgent';

describe('orchestratorAgent (Advanced Version)', () => {
  it('is configured correctly with delegation tools', () => {
    expect(orchestratorAgent.name).toBe('オーケストラエージェント');
    expect(orchestratorAgent.instructions).toContain('中央制御エージェント');
    expect(orchestratorAgent.model).toBe('openai-gpt-4o');
    expect(orchestratorAgent.tools).toBeDefined();
  });
  
  it('has all delegation tools configured', () => {
    expect(orchestratorAgent.tools.delegateTradingTool).toBeDefined();
    expect(orchestratorAgent.tools.delegateResearchTool).toBeDefined();
    expect(orchestratorAgent.tools.delegateUiControlTool).toBeDefined();
    expect(orchestratorAgent.tools.delegateBacktestTool).toBeDefined();
  });

  it('has comprehensive agent delegation instructions', () => {
    expect(orchestratorAgent.instructions).toContain('トレーディングアドバイザー');
    expect(orchestratorAgent.instructions).toContain('市場リサーチスペシャリスト');
    expect(orchestratorAgent.instructions).toContain('UIコントロールスペシャリスト');
    expect(orchestratorAgent.instructions).toContain('バックテストスペシャリスト');
  });

  it('exports individual delegation tools', () => {
    expect(delegateTradingTool.id).toBe('delegate_trading');
    expect(delegateResearchTool.id).toBe('delegate_research'); 
    expect(delegateUiControlTool.id).toBe('delegate_ui_control');
    expect(delegateBacktestTool.id).toBe('delegate_backtest');
  });
});
