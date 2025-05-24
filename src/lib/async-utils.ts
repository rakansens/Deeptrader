/**
 * Async Processing and Response Utilities
 * 
 * Created: Phase 6A-10 統合実装
 * - 4箇所の非同期レスポンス処理重複を一元化
 * - await response.json().catch()パターンの統一
 * - エラーハンドリング付き安全なJSON解析
 */

/**
 * レスポンスから安全にJSONを解析
 * await response.json().catch(() => ({ success: true })) パターンを統一
 */
export async function safeParseJSON<T = any>(
  response: Response,
  fallbackData: T
): Promise<T> {
  try {
    return await response.json();
  } catch {
    return fallbackData;
  }
}

/**
 * 成功レスポンスの安全なJSON解析
 * よく使われる成功時のフォールバック
 */
export async function parseSuccessResponse(response: Response): Promise<{ success: boolean }> {
  return safeParseJSON(response, { success: true });
}

/**
 * エラーレスポンスの安全なJSON解析
 * HTTPステータスを含むエラー情報を生成
 */
export async function parseErrorResponse(response: Response): Promise<{ error: string }> {
  return safeParseJSON(response, { error: `HTTP ${response.status}` });
}

/**
 * レスポンス成功/失敗に応じた安全なJSON解析
 * 統合された条件分岐処理
 */
export async function parseResponseByStatus(response: Response): Promise<any> {
  if (response.ok) {
    return parseSuccessResponse(response);
  } else {
    return parseErrorResponse(response);
  }
}

/**
 * 非同期処理のエラーハンドリング付きラッパー
 * try-catch付きで安全な非同期実行
 */
export async function safeAsyncExecution<T>(
  asyncFn: () => Promise<T>,
  fallbackValue: T,
  errorCallback?: (error: unknown) => void
): Promise<T> {
  try {
    return await asyncFn();
  } catch (error) {
    if (errorCallback) {
      errorCallback(error);
    }
    return fallbackValue;
  }
}

/**
 * Promise配列の安全な並行実行
 * Promise.allの安全版（一部失敗でも続行）
 */
export async function safePromiseAll<T>(
  promises: Promise<T>[],
  fallbackValue: T
): Promise<T[]> {
  const results = await Promise.allSettled(promises);
  return results.map(result => 
    result.status === 'fulfilled' ? result.value : fallbackValue
  );
}

/**
 * タイムアウト付き非同期処理
 * 既存のfetchWithTimeoutを補完する汎用版
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ]);
} 