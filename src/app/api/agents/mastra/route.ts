// src/app/api/agents/mastra/route.ts
// MASTRAエージェント専用APIエンドポイント（構造整理版）
// ハードコード削除 - エージェント自身がUI操作判断する真のインテリジェント実装

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
      await executeUIOperationsIfNeeded(message, response);

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
async function executeUIOperationsIfNeeded(userMessage: string, agentResponse: any) {
  try {
    console.log('🎯 UI操作実行チェック:', { userMessage, agentResponse });
    
    // エージェントがツールを使用してUI操作コマンドを生成した場合
    if (agentResponse && agentResponse.toolResults) {
      for (const toolResult of agentResponse.toolResults) {
        if (toolResult.toolName === 'generateUIOperationTool' && toolResult.result?.uiOperation) {
          const uiOperation = toolResult.result.uiOperation;
          console.log('🎯 エージェント生成のUI操作実行:', uiOperation);
          
          await executeUIOperation(uiOperation);
          return; // UI操作が実行されたので終了
        }
      }
    }
    
    console.log('🔍 エージェント生成のUI操作なし:', userMessage);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logAgentActivity('MASTRA Agent', 'UI操作実行エラー', errorMessage, false);
  }
}

// 実際のUI操作実行関数
async function executeUIOperation(uiOperation: any) {
  try {
    console.log('🎯 UI操作実行:', uiOperation);
    
    // Socket.IOサーバーのHTTP POST /ui-operationエンドポイントを使用（タイムアウト付き）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch('http://127.0.0.1:8080/ui-operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uiOperation),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json().catch(() => ({ success: true }));
        logAgentActivity('MASTRA Agent', 'UI操作実行成功', { 
          operation: uiOperation.operation, 
          payload: uiOperation.payload, 
          result 
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        logAgentActivity('MASTRA Agent', 'UI操作実行失敗', { 
          operation: uiOperation.operation, 
          payload: uiOperation.payload, 
          error: errorData 
        }, false);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const errorInstance = fetchError as Error;
      logAgentActivity('MASTRA Agent', 'WebSocket UI操作エラー', errorInstance.message, false);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logAgentActivity('MASTRA Agent', 'UI操作実行エラー', errorMessage, false);
  }
} 