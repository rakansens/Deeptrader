// src/app/api/agent/route.ts
// MASTRAエージェント専用APIエンドポイント（完全サーバーサイド版）
// Phase 6A-3: APIレスポンス生成統合

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessNextResponse, createErrorNextResponse } from '@/lib/api-response';

export const runtime = "nodejs"; // Node.js専用実行環境

export async function POST(req: NextRequest) {
  try {
    const { message, symbol, timeframe } = await req.json();
    
    console.log('🤖 MASTRAエージェント専用API - 受信:', { message, symbol, timeframe });
    
    try {
      // 完全にサーバーサイドでのみMASTRAエージェント実行
      console.log('🔧 サーバーサイドMASTRAエージェント初期化中...');
      
      // 動的インポートでサーバーサイド専用実行
      const { unifiedOrchestratorAgent } = await import('@/mastra/agents/orchestratorAgent');
      
      console.log('✅ MASTRAエージェント初期化完了');
      
      const response = await unifiedOrchestratorAgent.analyzeAndDelegate(message, {
        symbol: symbol || 'BTCUSDT',
        timeframe: timeframe || '1h'
      });

      const responseText = response.response || 'エージェントから応答を取得できませんでした。';
      
      console.log('📤 MASTRAエージェント応答:', responseText.substring(0, 200) + '...');
      
      // WebSocket経由でUI操作も実行（実際のUI変更）
      await executeUIOperationsIfNeeded(message, responseText);

      return createSuccessNextResponse({
        message: responseText,
        agent: 'orchestrator',
        mode: 'mastra'
      });
      
    } catch (agentError) {
      console.log('⚠️ MASTRAエージェントエラー:', agentError);
      
      return createErrorNextResponse(
        agentError instanceof Error ? agentError : new Error('Unknown agent error'),
        'MASTRAエージェントでエラーが発生しました。WebSocketベースのUI操作機能は正常に動作しています。',
        500,
        'api',
        'mastra'
      );
    }
    
  } catch (error) {
    console.error('❌ Agent API Error:', error);
    
    return createErrorNextResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'エージェントAPIでエラーが発生しました',
      500
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
        const command = {
          id: `mastra_${Date.now()}`,
          type: 'ui_operation',
          operation,
          payload,
          timestamp: new Date().toISOString(),
          source: 'mastra_server_agent'
        };
        
        console.log('🤖→🖥️ MASTRAエージェント→WebSocket UI操作:', operation, payload);
        ws.send(JSON.stringify(command));
        
        setTimeout(() => ws.close(), 1000);
      });
      
      ws.on('error', (error) => {
        console.log('⚠️ WebSocket UI操作送信エラー:', error.message);
      });
    }
  } catch (error) {
    console.log('⚠️ UI操作実行エラー:', error);
  }
} 