/**
 * Async State Management Hook
 * 
 * Created: Phase 6B-1 統合実装
 * - 30+箇所の非同期状態管理重複を一元化
 * - loading/error/data状態の統一管理
 * - async useCallbackパターンの標準化
 * - finally句でのローディング終了処理統合
 */

import { useState, useCallback, useRef, useEffect, DependencyList } from 'react';
import { getErrorMessage } from '@/lib/error-utils';

/**
 * 非同期操作の共通状態インターフェース
 */
export interface AsyncState<T, E = string> {
  data: T | null;
  loading: boolean;
  error: E | null;
  isInitialized: boolean;
}

/**
 * 非同期操作の共通オプション
 */
export interface UseAsyncStateOptions<T, E = string> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: E) => void;
  retryCount?: number;
  retryDelay?: number;
  autoExecute?: boolean;
  resetOnExecute?: boolean;
}

/**
 * 非同期操作の戻り値インターフェース
 */
export interface UseAsyncStateReturn<T, E = string> extends AsyncState<T, E> {
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: E | null) => void;
  retry: () => Promise<T>;
}

/**
 * 非同期状態管理の統合Hook
 * 
 * @param asyncFn - 実行する非同期関数
 * @param deps - 依存配列
 * @param options - オプション設定
 * @returns 非同期状態と操作関数
 * 
 * @example
 * ```typescript
 * const { data, loading, error, execute } = useAsyncState(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     return response.json();
 *   },
 *   [],
 *   { autoExecute: true }
 * );
 * ```
 */
export function useAsyncState<T, E = string>(
  asyncFn: (...args: any[]) => Promise<T>,
  deps: DependencyList = [],
  options: UseAsyncStateOptions<T, E> = {}
): UseAsyncStateReturn<T, E> {
  const {
    initialData = null,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
    autoExecute = false,
    resetOnExecute = false
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<E | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const retryCountRef = useRef(0);
  const lastArgsRef = useRef<any[]>([]);
  const isMountedRef = useRef(true);

  // マウント状態の追跡
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 実行関数
  const execute = useCallback(async (...args: any[]): Promise<T> => {
    // 引数を保存（リトライ用）
    lastArgsRef.current = args;
    
    // リセットオプションが有効な場合
    if (resetOnExecute && !loading) {
      setData(null);
    }

    setLoading(true);
    setError(null);
    retryCountRef.current = 0;

    try {
      const result = await asyncFn(...args);
      
      // アンマウント後の状態更新を防ぐ
      if (!isMountedRef.current) return result;
      
      setData(result);
      setIsInitialized(true);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err) as E;
      
      // アンマウント後の状態更新を防ぐ
      if (!isMountedRef.current) throw err;
      
      setError(errorMessage);
      setIsInitialized(true);
      
      if (onError) {
        onError(errorMessage);
      }
      
      // リトライ処理
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        
        // リトライ遅延
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // 再実行
        return execute(...args);
      }
      
      throw err;
    } finally {
      // アンマウント後の状態更新を防ぐ
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [...deps, retryCount, retryDelay, onSuccess, onError, resetOnExecute]);

  // リセット関数
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    setIsInitialized(false);
    retryCountRef.current = 0;
  }, [initialData]);

  // リトライ関数
  const retry = useCallback(async (): Promise<T> => {
    return execute(...lastArgsRef.current);
  }, [execute]);

  // 自動実行
  useEffect(() => {
    if (autoExecute && !isInitialized) {
      execute();
    }
  }, [autoExecute, execute, isInitialized]);

  return {
    data,
    loading,
    error,
    isInitialized,
    execute,
    reset,
    setData,
    setError,
    retry
  };
}

/**
 * 複数の非同期操作を管理するHook
 * 
 * @example
 * ```typescript
 * const operations = useAsyncOperations({
 *   fetchUser: async (id: string) => api.getUser(id),
 *   updateUser: async (data: User) => api.updateUser(data),
 *   deleteUser: async (id: string) => api.deleteUser(id)
 * });
 * 
 * // 使用例
 * await operations.fetchUser.execute('123');
 * operations.updateUser.loading; // true/false
 * ```
 */
export function useAsyncOperations<
  T extends Record<string, (...args: any[]) => Promise<any>>
>(
  operations: T,
  globalOptions?: UseAsyncStateOptions<any>
): {
  [K in keyof T]: UseAsyncStateReturn<Awaited<ReturnType<T[K]>>>
} {
  const results: any = {};
  
  for (const key in operations) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key] = useAsyncState(operations[key], [], globalOptions);
  }
  
  return results;
}

/**
 * 非同期関数の即時実行Hook
 * useEffectの非同期処理を簡潔に記述
 * 
 * @example
 * ```typescript
 * useAsyncEffect(async () => {
 *   const data = await fetchData();
 *   setData(data);
 * }, []);
 * ```
 */
export function useAsyncEffect(
  effect: () => Promise<void | (() => void)>,
  deps: DependencyList
): void {
  useEffect(() => {
    let cleanup: void | (() => void);
    
    const executeEffect = async () => {
      cleanup = await effect();
    };
    
    executeEffect();
    
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, deps);
} 