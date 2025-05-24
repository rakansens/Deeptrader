// src/app/api/agents/mastra/route.ts
// MASTRAエージェント専用APIエンドポイント（構造整理版）
// 自然言語処理を大幅拡張 - 全時間足・インジケーター操作に対応

import { NextRequest, NextResponse } from 'next/server';
import { 
  AgentRequest, 
  AgentResponse, 
  UIOperation
} from '../shared/types';
import {
  createSuccessResponse, 
  createErrorResponse,
  extractParameters,
  logAgentActivity
} from '../shared/utils';

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse<AgentResponse>> {
  try {
    const { message, symbol, timeframe }: AgentRequest = await req.json();
    
    logAgentActivity('MASTRA Agent', '受信', { message, symbol, timeframe });
    
    try {
      // サーバーサイド専用でMASTRAエージェント実行
      logAgentActivity('MASTRA Agent', 'MASTRA初期化開始', {});
      
      const { unifiedOrchestratorAgent } = await import('@/mastra/agents/orchestratorAgent');
      
      logAgentActivity('MASTRA Agent', 'MASTRA初期化完了', {});
      
      const response = await unifiedOrchestratorAgent.analyzeAndDelegate(message, {
        symbol: symbol || 'BTCUSDT',
        timeframe: timeframe || '1h'
      });

      const responseText = response.response || 'エージェントから応答を取得できませんでした。';
      
      logAgentActivity('MASTRA Agent', 'MASTRA応答取得', {
        responseLength: responseText.length,
        targetAgent: response.targetAgent
      });
      
      // WebSocket経由でUI操作も実行（実際のUI変更）
      await executeUIOperationsIfNeeded(message, responseText);

      return NextResponse.json(createSuccessResponse({
        message: responseText,
        response: responseText,
        mode: 'mastra',
        agent: 'orchestrator'
      }));
      
    } catch (agentError) {
      logAgentActivity('MASTRA Agent', 'MASTRAエラー', agentError, false);
      
      return NextResponse.json(
        createErrorResponse(
          agentError instanceof Error ? agentError : new Error(String(agentError)),
          'MASTRAエージェントでエラーが発生しました',
          'mastra',
          'mastra'
        ),
        { status: 500 }
      );
    }
    
  } catch (error) {
    logAgentActivity('MASTRA Agent', 'APIエラー', error, false);
    
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        'エージェントAPIでエラーが発生しました',
        'api',
        'fallback'
      ),
      { status: 500 }
    );
  }
}

// サーバーサイドからWebSocket UI操作を実行
async function executeUIOperationsIfNeeded(userMessage: string, agentResponse: string) {
  try {
    const message = userMessage.toLowerCase();
    let operation: string | null = null;
    let payload: any = null;
    
    // 銘柄変更の検出
    if (message.includes('eth') || message.includes('イーサ')) {
      operation = 'change_symbol';
      payload = { symbol: 'ETHUSDT' };
    } else if (message.includes('btc') || message.includes('ビット')) {
      operation = 'change_symbol';
      payload = { symbol: 'BTCUSDT' };
    } 
    // 時間足変更の柔軟な検出
    else if (message.includes('1m') || message.includes('1分')) {
      operation = 'change_timeframe';
      payload = { timeframe: '1m' };
    } else if (message.includes('3m') || message.includes('3分')) {
      operation = 'change_timeframe';
      payload = { timeframe: '3m' };
    } else if (message.includes('5m') || message.includes('5分')) {
      operation = 'change_timeframe';
      payload = { timeframe: '5m' };
    } else if (message.includes('15m') || message.includes('15分')) {
      operation = 'change_timeframe';
      payload = { timeframe: '15m' };
    } else if (message.includes('30m') || message.includes('30分')) {
      operation = 'change_timeframe';
      payload = { timeframe: '30m' };
    } else if (message.includes('1h') || message.includes('1時間')) {
      operation = 'change_timeframe';
      payload = { timeframe: '1h' };
    } else if (message.includes('2h') || message.includes('2時間')) {
      operation = 'change_timeframe';
      payload = { timeframe: '2h' };
    } else if (message.includes('4h') || message.includes('4時間')) {
      operation = 'change_timeframe';
      payload = { timeframe: '4h' };
    } else if (message.includes('6h') || message.includes('6時間')) {
      operation = 'change_timeframe';
      payload = { timeframe: '6h' };
    } else if (message.includes('8h') || message.includes('8時間')) {
      operation = 'change_timeframe';
      payload = { timeframe: '8h' };
    } else if (message.includes('12h') || message.includes('12時間')) {
      operation = 'change_timeframe';
      payload = { timeframe: '12h' };
    } else if (message.includes('1d') || message.includes('日足') || message.includes('1日')) {
      operation = 'change_timeframe';
      payload = { timeframe: '1d' };
    } else if (message.includes('3d') || message.includes('3日')) {
      operation = 'change_timeframe';
      payload = { timeframe: '3d' };
    } else if (message.includes('1w') || message.includes('週足') || message.includes('1週間')) {
      operation = 'change_timeframe';
      payload = { timeframe: '1w' };
    } else if (message.includes('1mon') || message.includes('月足') || message.includes('1か月') || message.includes('1ヶ月')) {
      operation = 'change_timeframe';
      payload = { timeframe: '1M' };
    }
    // インジケーター操作の検出
    else if (message.includes('rsi') && (message.includes('表示') || message.includes('オン'))) {
      operation = 'toggle_indicator';
      payload = { indicator: 'rsi', enabled: true };
    } else if (message.includes('rsi') && (message.includes('非表示') || message.includes('オフ'))) {
      operation = 'toggle_indicator';
      payload = { indicator: 'rsi', enabled: false };
    } else if (message.includes('macd') && (message.includes('表示') || message.includes('オン'))) {
      operation = 'toggle_indicator';
      payload = { indicator: 'macd', enabled: true };
    } else if (message.includes('macd') && (message.includes('非表示') || message.includes('オフ'))) {
      operation = 'toggle_indicator';
      payload = { indicator: 'macd', enabled: false };
    } else if (message.includes('移動平均') || message.includes('ma')) {
      if (message.includes('表示') || message.includes('オン')) {
        operation = 'toggle_indicator';
        payload = { indicator: 'ma', enabled: true };
      } else if (message.includes('非表示') || message.includes('オフ')) {
        operation = 'toggle_indicator';
        payload = { indicator: 'ma', enabled: false };
      }
    }
    
    if (operation && payload) {
      console.log('🎯 UI操作検出:', { operation, payload, originalMessage: userMessage });
      
      // Socket.IOサーバーのHTTP POST /ui-operationエンドポイントを使用（タイムアウト付き）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      try {
        const response = await fetch('http://127.0.0.1:8080/ui-operation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ui_operation',
            operation: operation,
            payload,
            description: `MASTRAエージェントによる${operation}実行`,
            source: 'mastra_server_agent',
            timestamp: new Date().toISOString()
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json().catch(() => ({ success: true }));
          logAgentActivity('MASTRA Agent', 'UI操作実行成功', { operation, payload, result });
        } else {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          logAgentActivity('MASTRA Agent', 'UI操作実行失敗', { operation, payload, error: errorData }, false);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        const errorInstance = fetchError as Error;
        logAgentActivity('MASTRA Agent', 'WebSocket UI操作エラー', errorInstance.message, false);
      }
    } else {
      console.log('🔍 UI操作未検出:', userMessage);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logAgentActivity('MASTRA Agent', 'UI操作実行エラー', errorMessage, false);
  }
} 