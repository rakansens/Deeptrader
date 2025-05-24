// src/mastra/tools/delegationTools.ts
// 循環依存解決版 - インターフェースベースの委任ツール
// UI操作生成ツール追加でエージェントによる真のインテリジェント判断を実現

import { Tool, createTool } from '@mastra/core/tools';
import { errorHandler, ErrorType } from '@/lib/error-handler';
import { AppConfig } from '@/config';
import { z } from 'zod';

// �� インターフェース定義（循環依存回避）
export interface DelegationRequest {
  agentType: 'trading' | 'research' | 'ui' | 'backtest';
  message: string;
  context?: Record<string, any>;
  requestId?: string;
}

export interface DelegationResponse {
  success: boolean;
  agentType: string;
  response?: string;
  error?: string;
  executionTime?: number;
  requestId?: string;
}

// 🎯 委任実行ハンドラー（外部注入される）
type DelegationHandler = (request: DelegationRequest) => Promise<DelegationResponse>;

// グローバル委任ハンドラー（オーケストレーターから設定される）
let globalDelegationHandler: DelegationHandler | null = null;

export function setDelegationHandler(handler: DelegationHandler) {
  globalDelegationHandler = handler;
  console.log('✅ 委任ハンドラーが設定されました');
}

// 🚀 共通委任実行関数
async function executeDelegation(request: DelegationRequest): Promise<DelegationResponse> {
  const startTime = Date.now();
  
  try {
    if (!globalDelegationHandler) {
      throw new Error('委任ハンドラーが設定されていません');
    }

    console.log(`🎯 ${request.agentType}エージェントに委任:`, request.message);
    
    const response = await globalDelegationHandler(request);
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ ${request.agentType}エージェント応答完了 (${executionTime}ms)`);
    
    return {
      ...response,
      executionTime,
      requestId: request.requestId
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const appError = errorHandler.handleError(error, ErrorType.MASTRA_ERROR, {
      agentType: request.agentType,
      message: request.message,
      executionTime
    });

    console.error(`❌ ${request.agentType}エージェント委任失敗:`, appError.message);
    
    return {
      success: false,
      agentType: request.agentType,
      error: appError.message,
      executionTime,
      requestId: request.requestId
    };
  }
}

// 🎯 トレーディングエージェント委任ツール
export const delegateTradingTool = createTool({
  id: 'delegate_trading',
  description: 'トレーディング戦略、チャート分析、市場分析の質問をトレーディングエージェントに委任します',
  inputSchema: z.object({
    message: z.string().describe('トレーディング関連の質問やリクエスト'),
    symbol: z.string().default('BTCUSDT').describe('対象銘柄（例: BTCUSDT）'),
    timeframe: z.string().default('1h').describe('時間足（例: 1h, 4h, 1d）')
  }),
  execute: async ({ context }) => {
    const { message, symbol, timeframe } = context;
    return await executeDelegation({
      agentType: 'trading',
      message,
      context: { symbol, timeframe },
      requestId: `trading_${Date.now()}`
    });
  }
});

// 🔍 リサーチエージェント委任ツール
export const delegateResearchTool = createTool({
  id: 'delegate_research',
  description: 'ニュース分析、センチメント分析、ファンダメンタル分析をリサーチエージェントに委任します',
  inputSchema: z.object({
    message: z.string().describe('リサーチ関連の質問やリクエスト'),
    scope: z.string().default('news').describe('調査範囲（news, sentiment, fundamental）')
  }),
  execute: async ({ context }) => {
    const { message, scope } = context;
    return await executeDelegation({
      agentType: 'research',
      message,
      context: { scope },
      requestId: `research_${Date.now()}`
    });
  }
});

// 🖥️ UIコントロールエージェント委任ツール
export const delegateUiControlTool = createTool({
  id: 'delegate_ui_control',
  description: 'チャート操作、画面設定、インターフェース制御をUIエージェントに委任します',
  inputSchema: z.object({
    message: z.string().describe('UI操作関連のリクエスト'),
    operationType: z.string().default('chart').describe('操作タイプ（chart, settings, theme）')
  }),
  execute: async ({ context }) => {
    const { message, operationType } = context;
    return await executeDelegation({
      agentType: 'ui',
      message,
      context: { operationType },
      requestId: `ui_${Date.now()}`
    });
  }
});

// 🎯 UI操作生成ツール（エージェントが具体的なUI操作を判断）
export const generateUIOperationTool = createTool({
  id: 'generate_ui_operation',
  description: 'ユーザーの自然言語要求を分析して具体的なUI操作コマンドを生成します',
  inputSchema: z.object({
    userMessage: z.string().describe('ユーザーからの自然言語での要求'),
    currentSymbol: z.string().optional().describe('現在の表示銘柄'),
    currentTimeframe: z.string().optional().describe('現在の時間足'),
    operation: z.enum(['change_timeframe', 'change_symbol', 'toggle_indicator']).describe('実行する操作タイプ'),
    payload: z.object({
      timeframe: z.string().optional().describe('変更先の時間足（1m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M）'),
      symbol: z.string().optional().describe('変更先の銘柄（BTCUSDT, ETHUSDT等）'),
      indicator: z.string().optional().describe('操作対象のインジケーター（rsi, macd, ma, boll, bollinger_bands）'),
      enabled: z.boolean().optional().describe('インジケーターの有効/無効状態')
    }).describe('操作の詳細パラメーター')
  }),
  execute: async ({ context }) => {
    const { userMessage, currentSymbol, currentTimeframe, operation, payload } = context;
    
    // UI操作コマンドを構造化して返す
    const uiOperation = {
      type: 'ui_operation',
      operation,
      payload,
      description: `${operation}の実行`,
      source: 'mastra_agent_generated',
      timestamp: new Date().toISOString(),
      userMessage,
      context: {
        currentSymbol,
        currentTimeframe
      }
    };
    
    console.log('🎯 エージェント生成UI操作:', uiOperation);
    
    return {
      success: true,
      agentType: 'ui',
      response: `UI操作コマンドを生成しました: ${operation}`,
      uiOperation, // 生成されたUI操作コマンド
      requestId: `ui_gen_${Date.now()}`
    };
  }
});

// 📊 バックテストエージェント委任ツール
export const delegateBacktestTool = createTool({
  id: 'delegate_backtest',
  description: '戦略検証、パフォーマンス分析、最適化をバックテストエージェントに委任します',
  inputSchema: z.object({
    message: z.string().describe('バックテスト関連のリクエスト'),
    strategy: z.string().default('moving_average').describe('検証対象戦略'),
    period: z.string().default('1month').describe('検証期間')
  }),
  execute: async ({ context }) => {
    const { message, strategy, period } = context;
    return await executeDelegation({
      agentType: 'backtest',
      message,
      context: { strategy, period },
      requestId: `backtest_${Date.now()}`
    });
  }
});

// 📋 全委任ツールエクスポート
export const allDelegationTools = {
  delegateTradingTool,
  delegateResearchTool,
  delegateUiControlTool,
  delegateBacktestTool,
  generateUIOperationTool
} as const;

// 🧪 設定検証
export function validateDelegationConfig(): boolean {
  if (!AppConfig.mastra.enabled) {
    console.warn('⚠️ MASTRAが無効です。委任ツールは動作しません。');
    return false;
  }

  if (!globalDelegationHandler) {
    console.warn('⚠️ 委任ハンドラーが設定されていません。');
    return false;
  }

  console.log('✅ 委任ツール設定検証完了');
  return true;
} 