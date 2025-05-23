// src/tests/mastra/tools/delegationTools.test.ts
// 委任ツールのテスト

// グローバルモック設定
global.fetch = jest.fn();

// Mastraコアモック
jest.mock('@mastra/core', () => ({
  Tool: class {
    id!: string;
    description!: string;
    execute: any;
    schema: any;
    constructor(config: any) {
      Object.assign(this, config);
    }
  }
}), { virtual: true });

// Mastraメモリモック
jest.mock('@mastra/memory', () => ({
  Memory: class {
    constructor(public opts: any) {}
  }
}), { virtual: true });

// AI SDKモック
jest.mock('@ai-sdk/openai', () => ({ 
  openai: (model: string) => `openai-${model}` 
}), { virtual: true });

// 環境変数モック
jest.mock('@/config/server', () => ({
  serverEnv: {
    AI_MODEL: 'gpt-4o'
  }
}), { virtual: true });

// データベースアダプターモック
jest.mock('@/mastra/adapters/SupabaseVector', () => ({
  SupabaseVector: class {}
}), { virtual: true });

// Zodモック
jest.mock('zod', () => ({
  z: {
    object: () => ({
      string: () => ({ optional: () => ({}) }),
    }),
    string: () => ({ optional: () => ({}) }),
  }
}), { virtual: true });

// 定数モック
jest.mock('@/constants/chart', () => ({
  TIMEFRAMES: ['1m', '5m', '15m', '1h', '4h', '1d'],
  type: 'Timeframe',
}), { virtual: true });

// エージェントモック
jest.mock('@/mastra/agents/tradingAgent', () => ({
  tradingAgent: {
    text: jest.fn().mockResolvedValue('Trading analysis result'),
  },
}), { virtual: true });

jest.mock('@/mastra/agents/researchAgent', () => ({
  researchAgent: {
    text: jest.fn().mockResolvedValue('Research analysis result'),
  },
}), { virtual: true });

jest.mock('@/mastra/agents/uiControlAgent', () => ({
  uiControlAgent: {
    text: jest.fn().mockResolvedValue('UI control result'),
  },
}), { virtual: true });

jest.mock('@/mastra/agents/backtestAgent', () => ({
  backtestAgent: {
    text: jest.fn().mockResolvedValue('Backtest analysis result'),
  },
}), { virtual: true });

describe('delegationTools Module', () => {
  it('module can be imported without errors', async () => {
    const module = await import('@/mastra/tools/delegationTools');
    expect(module).toBeDefined();
    expect(module.delegateTradingTool).toBeDefined();
    expect(module.delegateResearchTool).toBeDefined();
    expect(module.delegateUiControlTool).toBeDefined();
    expect(module.delegateBacktestTool).toBeDefined();
  });

  it('all delegation tools have correct IDs', async () => {
    const {
      delegateTradingTool,
      delegateResearchTool,
      delegateUiControlTool,
      delegateBacktestTool,
    } = await import('@/mastra/tools/delegationTools');

    expect(delegateTradingTool.id).toBe('delegate_trading');
    expect(delegateResearchTool.id).toBe('delegate_research');
    expect(delegateUiControlTool.id).toBe('delegate_ui_control');
    expect(delegateBacktestTool.id).toBe('delegate_backtest');
  });

  it('all delegation tools have descriptions', async () => {
    const {
      delegateTradingTool,
      delegateResearchTool,
      delegateUiControlTool,
      delegateBacktestTool,
    } = await import('@/mastra/tools/delegationTools');

    expect(delegateTradingTool.description).toContain('Trading Agent');
    expect(delegateResearchTool.description).toContain('Research Agent');
    expect(delegateUiControlTool.description).toContain('UI Control Agent');
    expect(delegateBacktestTool.description).toContain('Backtest Agent');
  });
}); 