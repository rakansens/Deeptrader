// src/app/api/agents/shared/types.ts
// エージェント共通型定義 - 構造整理により重複削除と型安全性向上
// Phase 5A: UIOperation型を@/types/commonに統合

import type { UIOperation } from '@/types';

// UIOperation型をre-export（他のagentファイルからも使用可能に）
export type { UIOperation } from '@/types';

// 基本的なAPI要求の型定義
export interface AgentRequest {
  message: string;
  symbol?: string;
  timeframe?: string;
  strategy?: 'auto' | 'mastra' | 'pure';
  context?: Record<string, any>;
}

// 基本的なAPI応答の型定義
export interface AgentResponse {
  success: boolean;
  message?: string;
  response?: string;
  error?: string;
  details?: string;
  timestamp: string;
  mode: 'mastra' | 'pure' | 'hybrid' | 'fallback';
  agent?: string;
  executedOperations?: UIOperation[];
  totalOperations?: number;
  source?: 'mastra' | 'pure' | 'websocket' | 'api';
}

// オーケストレーター応答型（既存より移行）
export interface OrchestratorResponse {
  targetAgent: 'trading' | 'research' | 'backtest' | 'ui' | 'general';
  action: string;
  parameters?: Record<string, any>;
  reasoning: string;
  response: string;
  mastraUsed: boolean;
}

// 実行結果の型定義
export interface ExecutionResult {
  success: boolean;
  response: string;
  executedOperations?: UIOperation[];
  type: 'ui_control' | 'trading_analysis' | 'research' | 'backtest' | 'general';
  analysis?: Record<string, any>;
  research?: Record<string, any>;
  backtest?: Record<string, any>;
}

// エラー情報の型定義
export interface AgentError {
  code: string;
  message: string;
  details?: string;
  stack?: string;
  timestamp: string;
  source: 'mastra' | 'pure' | 'websocket' | 'api';
}

// WebSocket命令の型定義
export interface WebSocketCommand {
  id: string;
  type: 'ui_operation';
  operation: UIOperation['type'];
  payload: Record<string, any>;
  timestamp: string;
  source: string;
  description?: string;
}

// 委任パラメータの型定義
export interface DelegationContext {
  symbol?: string;
  timeframe?: string;
  currentChartData?: any;
  userPreferences?: Record<string, any>;
} 