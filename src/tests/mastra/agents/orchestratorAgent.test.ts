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
  unifiedOrchestratorAgent,
  delegateTradingTool,
  delegateResearchTool,
  delegateUiControlTool,
  delegateBacktestTool,
} from '@/mastra/agents/orchestratorAgent';

describe('統合オーケストレーターエージェント', () => {
  it('オーケストレーターが正常に初期化される', () => {
    expect(unifiedOrchestratorAgent).toBeDefined();
    expect(typeof unifiedOrchestratorAgent.analyzeAndDelegate).toBe('function');
  });

  it('委任ツールが正常に初期化される', () => {
    expect(delegateTradingTool).toBeDefined();
    expect(delegateResearchTool).toBeDefined();
    expect(delegateUiControlTool).toBeDefined();
    expect(delegateBacktestTool).toBeDefined();
  });

  it('analyzeAndDelegateメソッドが動作する', async () => {
    const result = await unifiedOrchestratorAgent.analyzeAndDelegate('テストメッセージ');
    expect(result).toBeDefined();
    expect(result.targetAgent).toBeDefined();
    expect(result.response).toBeDefined();
    expect(typeof result.mastraUsed).toBe('boolean');
  });
});
