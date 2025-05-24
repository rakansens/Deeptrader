// src/lib/error-utils.ts
// エラーハンドリング統一ユーティリティ - Phase 6A-4統合
// 全コードベースで一貫したエラー処理を提供

/**
 * エラーオブジェクトから安全にメッセージを抽出
 * 30+箇所で重複していた `error instanceof Error ? error.message : String(error)` を統一
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * エラーオブジェクトから安全にスタックトレースを抽出
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * エラーオブジェクトを安全にError型に変換
 * `error instanceof Error ? error : new Error(String(error))` パターンを統一
 */
export function ensureError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

/**
 * エラー情報を含む安全なオブジェクトを生成
 * ログ出力や応答生成で使用
 */
export interface SafeErrorInfo {
  message: string;
  stack?: string;
  isError: boolean;
}

export function getSafeErrorInfo(error: unknown): SafeErrorInfo {
  return {
    message: getErrorMessage(error),
    stack: getErrorStack(error),
    isError: error instanceof Error
  };
}

/**
 * デバッグ用：エラーの詳細情報を文字列として取得
 */
export function getErrorDetails(error: unknown, includeStack = false): string {
  const info = getSafeErrorInfo(error);
  let details = `Error: ${info.message}`;
  
  if (includeStack && info.stack) {
    details += `\nStack: ${info.stack}`;
  }
  
  return details;
}

/**
 * エラーのタイプを判定
 */
export function getErrorType(error: unknown): 'Error' | 'string' | 'object' | 'other' {
  if (error instanceof Error) return 'Error';
  if (typeof error === 'string') return 'string';
  if (typeof error === 'object' && error !== null) return 'object';
  return 'other';
}

/**
 * 条件付きエラーメッセージ取得
 * フォールバックメッセージを指定可能
 */
export function getErrorMessageWithFallback(
  error: unknown, 
  fallback = '不明なエラーが発生しました'
): string {
  const message = getErrorMessage(error);
  return message || fallback;
} 