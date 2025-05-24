// src/app/api/agents/mastra/route.ts
// MASTRAエージェント専用APIエンドポイント（構造整理版）
// ハードコード削除 - エージェント自身がUI操作判断する真のインテリジェント実装
// Phase 6A-2: fetchWithTimeout統合によるAbortController重複解消
// Phase 6A-4: エラーハンドリング統合

import { NextRequest, NextResponse } from 'next/server';
import { 
  AgentRequest, 
  AgentResponse 
} from '../shared/types';
import {
  createSuccessResponse, 
  createErrorResponse,
  extractParameters,
  logAgentActivity
} from '../shared/utils';
import { fetchWithTimeout } from '@/lib/fetch';
import { getErrorMessage, ensureError } from '@/lib/error-utils';
import { parseSuccessResponse, parseErrorResponse } from '@/lib/async-utils';

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
      
      // 🔍 MASTRA応答構造をデバッグ
      console.log('🔍 MASTRA完全応答構造:', JSON.stringify(response, null, 2));
      
      // WebSocket経由でUI操作も実行（実際のUI変更）
      await executeUIOperationsIfNeeded(message, response);

      return NextResponse.json(createSuccessResponse({
        message: responseText,
        response: responseText,
        mode: 'mastra' as const,
        agent: 'orchestrator'
      }));
      
    } catch (agentError) {
      logAgentActivity('MASTRA Agent', 'MASTRAエラー', agentError, false);
      
      return NextResponse.json(
        createErrorResponse(
          ensureError(agentError),
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
        ensureError(error),
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
    
    // MASTRA応答からツール実行結果を取得（複数の構造に対応）
    let toolResults: any[] = [];
    
    if (agentResponse?.mastraResponse) {
      const mastraResp = agentResponse.mastraResponse;
      
      // 1. 直接のtoolResults
      if (mastraResp.toolResults && mastraResp.toolResults.length > 0) {
        toolResults = [...toolResults, ...mastraResp.toolResults];
      }
      
      // 2. steps配列内のtoolResults（MASTRAの実際の構造）
      if (mastraResp.steps && Array.isArray(mastraResp.steps)) {
        for (const step of mastraResp.steps) {
          if (step.toolResults && Array.isArray(step.toolResults)) {
            toolResults = [...toolResults, ...step.toolResults];
          }
        }
      }
      
      // 3. その他の可能な構造
      if (mastraResp.toolCalls) {
        toolResults = [...toolResults, ...mastraResp.toolCalls];
      }
      if (mastraResp.toolInvocations) {
        toolResults = [...toolResults, ...mastraResp.toolInvocations];
      }
      if (mastraResp.tools) {
        toolResults = [...toolResults, ...mastraResp.tools];
      }
      
      console.log('🔍 抽出されたツール結果:', toolResults);
    }
    
    // 従来の形式もチェック
    if (agentResponse?.toolResults) {
      toolResults = [...toolResults, ...agentResponse.toolResults];
    }
    
    // ツール実行結果からUI操作を探す
    for (const toolResult of toolResults) {
      console.log('🔍 ツール結果チェック:', toolResult);
      
      // generateUIOperationToolの実行結果を探す
      if (
        (toolResult.toolName === 'generateUIOperationTool' || 
         toolResult.type === 'generateUIOperationTool' ||
         toolResult.name === 'generateUIOperationTool') && 
        toolResult.result?.uiOperation
      ) {
        const uiOperation = toolResult.result.uiOperation;
        console.log('🎯 エージェント生成のUI操作実行:', uiOperation);
        
        await executeUIOperation(uiOperation);
        return; // UI操作が実行されたので終了
      }
      
      // UI操作が直接含まれている場合
      if (toolResult.uiOperation) {
        console.log('🎯 直接UI操作実行:', toolResult.uiOperation);
        await executeUIOperation(toolResult.uiOperation);
        return;
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
    
    try {
      const response = await fetchWithTimeout('http://127.0.0.1:8080/ui-operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uiOperation),
        timeout: 3000 // 3秒タイムアウト
      });
      
      if (response.ok) {
        const result = await parseSuccessResponse(response);
        logAgentActivity('MASTRA Agent', 'UI操作実行成功', { 
          operation: uiOperation.operation, 
          payload: uiOperation.payload, 
          result 
        });
      } else {
        const errorData = await parseErrorResponse(response);
        logAgentActivity('MASTRA Agent', 'UI操作実行失敗', { 
          operation: uiOperation.operation, 
          payload: uiOperation.payload, 
          error: errorData 
        }, false);
      }
    } catch (fetchError) {
      logAgentActivity('MASTRA Agent', 'WebSocket UI操作エラー', getErrorMessage(fetchError), false);
    }
  } catch (error) {
    logAgentActivity('MASTRA Agent', 'UI操作実行エラー', getErrorMessage(error), false);
  }
} 