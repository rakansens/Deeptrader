// src/app/api/agents/pure/route.ts
// MASTRA完全回避、純粋WebSocket自然言語UIコントロールエージェント（構造整理版）

import { NextRequest, NextResponse } from 'next/server';
import { 
  AgentRequest, 
  AgentResponse, 
  UIOperation
} from '../shared/types';
import {
  createSuccessResponse, 
  createErrorResponse,
  analyzeNaturalLanguageForUI,
  executeUIOperationViaWebSocket,
  generateNaturalResponse,
  logAgentActivity
} from '../shared/utils';

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse<AgentResponse>> {
  try {
    const { message, symbol, timeframe }: AgentRequest = await req.json();
    
    logAgentActivity('Pure Agent', '受信', { message, symbol, timeframe });
    
    // 段階1: 高度な自然言語解析
    const uiOperations = analyzeNaturalLanguageForUI(message);
    
    // 段階2: WebSocket経由でリアルタイムUI操作
    const executedOperations: UIOperation[] = [];
    for (const operation of uiOperations) {
      const success = await executeUIOperationViaWebSocket(operation);
      if (success) {
        executedOperations.push(operation);
      }
    }
    
    // 段階3: 自然言語レスポンス生成
    const responseText = generateNaturalResponse(message, executedOperations);
    
    logAgentActivity('Pure Agent', '実行完了', {
      totalOperations: uiOperations.length,
      executedOperations: executedOperations.length
    });
    
    return NextResponse.json(createSuccessResponse({
      message: responseText,
      response: responseText,
      mode: 'pure',
      agent: 'natural_language_ui_controller',
      executedOperations
    }));
    
  } catch (error) {
    logAgentActivity('Pure Agent', 'エラー', error, false);
    
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error : new Error(String(error)), 
        '純粋UIコントロールエージェントでエラーが発生しました', 
        'pure',
        'pure'
      ),
      { status: 500 }
    );
  }
} 