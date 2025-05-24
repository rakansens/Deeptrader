/**
 * Validation and Verification Utilities
 * 
 * Created: Phase 6A-8 統合実装
 * - 50+箇所のバリデーション・検証重複を一元化
 * - null/undefined/空文字列/配列の安全なチェック
 * - ブラウザ環境・プロパティ存在チェック
 */

/**
 * null/undefined チェック
 * if (value === null) || if (value !== null) パターンを統一
 */
export function isNull(value: any): value is null {
  return value === null;
}

export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isUndefined(value: any): value is undefined {
  return value === undefined;
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function isNullish(value: any): value is null | undefined {
  return value == null; // null または undefined
}

export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value != null; // null でも undefined でもない
}

/**
 * 文字列バリデーション
 * if (!text.trim()) || if (text.trim() === '') パターンを統一
 */
export function isEmptyString(value: any): boolean {
  return typeof value === 'string' && value.trim() === '';
}

export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function hasText(value: any): value is string {
  return isNonEmptyString(value);
}

/**
 * 配列バリデーション
 * if (array.length === 0) || if (array.length > 0) パターンを統一
 */
export function isEmptyArray(value: any): boolean {
  return Array.isArray(value) && value.length === 0;
}

export function isNonEmptyArray<T>(value: T[] | any): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

export function hasItems<T>(value: T[] | any): value is T[] {
  return isNonEmptyArray(value);
}

/**
 * オブジェクトプロパティ存在チェック
 * if (updates.field !== undefined) パターンを統一
 */
export function hasProperty<T, K extends keyof T>(
  obj: T, 
  key: K
): obj is T & Record<K, NonNullable<T[K]>> {
  return obj[key] !== undefined;
}

export function hasDefinedProperty<T, K extends keyof T>(
  obj: T, 
  key: K
): obj is T & Record<K, NonNullable<T[K]>> {
  return obj[key] !== undefined && obj[key] !== null;
}

/**
 * ブラウザ環境チェック
 * typeof window !== 'undefined' パターンを統一
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined';
}

export function isServerEnvironment(): boolean {
  return typeof window === 'undefined';
}

export function isClient(): boolean {
  return isBrowserEnvironment();
}

export function isServer(): boolean {
  return isServerEnvironment();
}

/**
 * 開発環境チェック
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * API機能存在チェック
 * typeof ResizeObserver !== "undefined" パターンを統一
 */
export function hasResizeObserver(): boolean {
  return isBrowserEnvironment() && typeof ResizeObserver !== 'undefined';
}

export function hasSpeechSynthesis(): boolean {
  return isBrowserEnvironment() && typeof window.speechSynthesis !== 'undefined';
}

/**
 * 複合バリデーション（よく使用される組み合わせ）
 */
export function isValidInput(value: any): value is string {
  return isNotNullish(value) && isNonEmptyString(value);
}

export function isValidArray<T>(value: any): value is T[] {
  return isNotNullish(value) && isNonEmptyArray(value);
}

export function isValidObject(value: any): value is object {
  return isNotNullish(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 条件付きアップデート用ヘルパー
 * if (updates.field !== undefined) dbUpdates.field = updates.field パターンを統一
 */
export function updateIfDefined<T, K extends keyof T>(
  target: T,
  source: Partial<T>,
  key: K
): void {
  if (hasProperty(source, key)) {
    target[key] = source[key] as T[K];
  }
}

export function updateAllDefined<T>(
  target: T,
  source: Partial<T>,
  keys: (keyof T)[]
): void {
  keys.forEach(key => {
    updateIfDefined(target, source, key);
  });
}

/**
 * デフォルト値付きバリデーション
 */
export function getValueOrDefault<T>(
  value: T | null | undefined,
  defaultValue: T
): T {
  return isNotNullish(value) ? value : defaultValue;
}

export function getStringOrDefault(
  value: any,
  defaultValue: string = ''
): string {
  return isNonEmptyString(value) ? value : defaultValue;
}

export function getArrayOrDefault<T>(
  value: any,
  defaultValue: T[] = []
): T[] {
  return Array.isArray(value) && value.length > 0 ? value as T[] : defaultValue;
} 