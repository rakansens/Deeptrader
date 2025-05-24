/**
 * Date and Time Utilities
 * 
 * Created: Phase 6A-7 統合実装
 * - 30+箇所の日付・時間処理重複を一元化
 * - タイムゾーン統一とISO文字列標準化
 * - Unix時間とISO時間の安全な変換
 */

/**
 * 現在時刻のISO文字列を取得
 * new Date().toISOString() パターンを統一
 */
export function getCurrentISOTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Unix時間（ミリ秒）をISO文字列に変換
 * new Date(timestamp).toISOString() パターンを統一
 */
export function unixToISOTimestamp(unixMs: number): string {
  return new Date(unixMs).toISOString();
}

/**
 * Unix時間（秒）をISO文字列に変換
 * new Date(number * 1000).toISOString() パターンを統一
 */
export function unixSecondsToISOTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

/**
 * ISO文字列をUnix時間（ミリ秒）に変換
 * new Date(timestamp).getTime() パターンを統一
 */
export function isoToUnixTimestamp(isoString: string): number {
  return new Date(isoString).getTime();
}

/**
 * 現在時刻のUnix時間（ミリ秒）を取得
 * Date.now() パターンを統一
 */
export function getCurrentUnixTimestamp(): number {
  return Date.now();
}

/**
 * Unix時間（秒）をUnix時間（ミリ秒）に変換
 * チャート時間の変換用
 */
export function unixSecondsToUnixMs(unixSeconds: number): number {
  return unixSeconds * 1000;
}

/**
 * Unix時間（ミリ秒）をUnix時間（秒）に変換
 * チャート時間の変換用
 */
export function unixMsToUnixSeconds(unixMs: number): number {
  return Math.floor(unixMs / 1000);
}

/**
 * 日付から安全なUnix時間（秒）を取得
 * チャート用の時間変換
 */
export function dateToUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * 文字列またはnumberからUnix時間（秒）を取得
 * チャート時間の安全な変換
 */
export function parseToUnixSeconds(time: string | number): number {
  if (typeof time === 'number') {
    return Math.floor(time / 1000);
  }
  return Math.floor(new Date(time).getTime() / 1000);
}

/**
 * タイムスタンプの比較用ソート関数
 * ログやデータの時系列ソート用
 */
export function compareTimestamps(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
}

/**
 * オプショナルタイムスタンプの安全な処理
 * undefined/nullの場合は現在時刻を返す
 */
export function safeTimestamp(timestamp?: string | null): string {
  return timestamp || getCurrentISOTimestamp();
}

/**
 * オプショナルUnixタイムスタンプの安全な処理
 * undefined/nullの場合は現在時刻を返す
 */
export function safeUnixTimestamp(timestamp?: number | null): number {
  return timestamp || getCurrentUnixTimestamp();
} 