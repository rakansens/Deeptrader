// src/lib/api-response.ts
// 共通APIレスポンス生成ユーティリティ - Phase 6A-3統合
// 全APIルートで一貫したレスポンス形式を提供
// Phase 6A-4: エラーハンドリング統合

import { NextResponse } from 'next/server';
import { getErrorMessage, getErrorStack } from './error-utils';

// 成功レスポンス用の型定義
export interface SuccessResponseData {
  message?: string;
  response?: string;
  mode: 'mastra' | 'pure' | 'hybrid' | 'fallback';
  agent?: string;
  executedOperations?: any[];
  [key: string]: any; // 追加のデータを許可
}

// エラーレスポンス用の型定義
export interface ErrorResponseData {
  error: string;
  details?: string;
  source: 'mastra' | 'pure' | 'websocket' | 'api';
  mode: 'mastra' | 'pure' | 'hybrid' | 'fallback';
  stack?: string;
}

/**
 * 成功レスポンスを生成
 */
export function createSuccessResponse(data: SuccessResponseData) {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    ...data
  };
}

/**
 * エラーレスポンスを生成
 */
export function createErrorResponse(
  error: string | Error, 
  details?: string, 
  source: 'mastra' | 'pure' | 'websocket' | 'api' = 'api',
  mode: 'mastra' | 'pure' | 'hybrid' | 'fallback' = 'fallback'
): ErrorResponseData & { success: false; timestamp: string } {
  const errorMessage = getErrorMessage(error);
  const errorStack = getErrorStack(error);
  
  return {
    success: false,
    error: errorMessage,
    details: details || '不明なエラーが発生しました',
    timestamp: new Date().toISOString(),
    mode,
    source,
    ...(errorStack && { stack: errorStack })
  };
}

/**
 * 成功レスポンスをNext.jsレスポンスとして返す
 */
export function createSuccessNextResponse(data: SuccessResponseData, status = 200) {
  return NextResponse.json(createSuccessResponse(data), { status });
}

/**
 * エラーレスポンスをNext.jsレスポンスとして返す
 */
export function createErrorNextResponse(
  error: string | Error,
  details?: string,
  status = 500,
  source: 'mastra' | 'pure' | 'websocket' | 'api' = 'api',
  mode: 'mastra' | 'pure' | 'hybrid' | 'fallback' = 'fallback'
) {
  return NextResponse.json(
    createErrorResponse(error, details, source, mode), 
    { status }
  );
} 