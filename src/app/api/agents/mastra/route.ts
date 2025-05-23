// src/app/api/agents/mastra/route.ts
// MASTRAエージェント専用APIエンドポイント（構造整理版）

import { NextRequest, NextResponse } from 'next/server';
import { 
  AgentRequest, 
  AgentResponse, 
  UIOperation,
  WebSocketCommand
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
    const { default: WebSocket } = await import('ws');
    
    const message = userMessage.toLowerCase();
    let operation: string | null = null;
    let payload: any = null;
    
    // 簡易的なUI操作検出
    if (message.includes('eth') || message.includes('イーサ')) {
      operation = 'change_symbol';
      payload = { symbol: 'ETHUSDT' };
    } else if (message.includes('btc') || message.includes('ビット')) {
      operation = 'change_symbol';
      payload = { symbol: 'BTCUSDT' };
    } else if (message.includes('4h') || message.includes('4時間')) {
      operation = 'change_timeframe';
      payload = { timeframe: '4h' };
    } else if (message.includes('1h') || message.includes('1時間')) {
      operation = 'change_timeframe';
      payload = { timeframe: '1h' };
    }
    
    if (operation && payload) {
      const ws = new WebSocket('ws://127.0.0.1:8080');
      
      ws.on('open', () => {
        const command: WebSocketCommand = {
          id: `mastra_${Date.now()}`,
          type: 'ui_operation',
          operation: operation as any,
          payload,
          timestamp: new Date().toISOString(),
          source: 'mastra_server_agent'
        };
        
        logAgentActivity('MASTRA Agent', 'WebSocket UI操作送信', { operation, payload });
        ws.send(JSON.stringify(command));
        
        setTimeout(() => ws.close(), 1000);
      });
      
      ws.on('error', (error) => {
        logAgentActivity('MASTRA Agent', 'WebSocket UI操作エラー', error.message, false);
      });
    }
  } catch (error) {
    logAgentActivity('MASTRA Agent', 'UI操作実行エラー', error, false);
  }
} 