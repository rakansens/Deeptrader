// src/app/api/agents/route.ts
// エージェント統合ルーター - 構造整理によりHTTP_COMMONSエラー回避とフォールバック実装
// undefinedメッセージの防御的処理追加でTypeErrorを回避

import { NextRequest, NextResponse } from 'next/server';
import { 
  AgentRequest, 
  AgentResponse
} from './shared/types';
import {
  createSuccessResponse, 
  createErrorResponse,
  logAgentActivity
} from './shared/utils';

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse<AgentResponse>> {
  try {
    const requestData: AgentRequest = await req.json();
    const { message, symbol, timeframe, strategy = 'auto' } = requestData;
    
    // メッセージの防御的チェック
    if (!message || typeof message !== 'string') {
      logAgentActivity('Unified Router', '無効なメッセージ受信', { 
        message, 
        symbol, 
        timeframe, 
        strategy 
      }, false);
      
      return NextResponse.json(
        createErrorResponse(
          new Error('メッセージが無効または空です'),
          'メッセージが正しく送信されていません',
          'api',
          'fallback'
        ),
        { status: 400 }
      );
    }
    
    logAgentActivity('Unified Router', '統合ルーター受信', { 
      message: message ? message.substring(0, 100) : '[空メッセージ]', 
      symbol, 
      timeframe, 
      strategy 
    });
    
    switch (strategy) {
      case 'mastra':
        return executeMASTRAAgent(requestData);
        
      case 'pure':
        return executePureAgent(requestData);
        
      case 'auto':
      default:
        // フォールバック戦略で自動選択
        try {
          logAgentActivity('Unified Router', 'MASTRAエージェント試行', {});
          const mastraResult = await executeMASTRAAgent(requestData);
          
          // MASTRAが成功した場合はその結果を返す
          const mastraResponse = await mastraResult.json();
          if (mastraResponse.success) {
            logAgentActivity('Unified Router', 'MASTRAエージェント成功', { mode: 'mastra' });
            return NextResponse.json({
              ...mastraResponse,
              mode: 'mastra' as const
            });
          } else {
            throw new Error('MASTRAエージェントが失敗');
          }
        } catch (mastraError) {
          logAgentActivity('Unified Router', 'MASTRAエラー→Pureフォールバック', mastraError, false);
          
          // MASTRAが失敗した場合はPureエージェントにフォールバック
          const pureResult = await executePureAgent(requestData);
          const pureResponse = await pureResult.json();
          
          return NextResponse.json({
            ...pureResponse,
            mode: 'fallback' as const,
            fallbackReason: 'MASTRA execution failed'
          });
        }
    }
    
  } catch (error) {
    logAgentActivity('Unified Router', 'ルーターエラー', error, false);
    
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        '統合エージェントルーターでエラーが発生しました',
        'api',
        'fallback'
      ),
      { status: 500 }
    );
  }
}

// MASTRAエージェント実行（直接関数呼び出し）
async function executeMASTRAAgent(requestData: AgentRequest): Promise<NextResponse<AgentResponse>> {
  try {
    // 直接MASTRAエージェントモジュールをインポートして実行
    const { POST: mastraHandler } = await import('./mastra/route');
    
    // リクエストオブジェクトを模擬
    const mockRequest = {
      json: async () => requestData
    } as NextRequest;
    
    return await mastraHandler(mockRequest);
    
  } catch (error) {
    logAgentActivity('MASTRA Executor', 'MASTRAエージェント実行エラー', error, false);
    throw error;
  }
}

// Pureエージェント実行（直接関数呼び出し）
async function executePureAgent(requestData: AgentRequest): Promise<NextResponse<AgentResponse>> {
  try {
    // 直接Pureエージェントモジュールをインポートして実行
    const { POST: pureHandler } = await import('./pure/route');
    
    // リクエストオブジェクトを模擬
    const mockRequest = {
      json: async () => requestData
    } as NextRequest;
    
    return await pureHandler(mockRequest);
    
  } catch (error) {
    logAgentActivity('Pure Executor', 'Pureエージェント実行エラー', error, false);
    
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        'Pure エージェント実行に失敗しました',
        'pure',
        'pure'
      ),
      { status: 500 }
    );
  }
} 