/**
 * ロギングユーティリティ
 * 開発時にコンソールへのログ出力を制御する
 */

import { LogLevel } from "@mastra/core/logger";

const levelOrder: Record<LogLevel, number> = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  silent: 5,
};

const envLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "development" ? "debug" : "silent");

function shouldLog(level: LogLevel) {
  return levelOrder[level] >= 0 && levelOrder[level] >= levelOrder[envLevel];
}

export const logger = {
  /**
   * デバッグログを出力
   * 開発モードでのみ表示されます
   */
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) console.debug('[DEBUG]', ...args);
  },

  /**
   * 情報ログを出力
   */
  info: (...args: unknown[]) => {
    if (shouldLog("info")) console.info('[INFO]', ...args);
  },

  /**
   * 警告ログを出力
   */
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) console.warn('[WARN]', ...args);
  },

  /**
   * エラーログを出力
   */
  error: (...args: unknown[]) => {
    if (shouldLog("error")) console.error('[ERROR]', ...args);
  },
};

export type Logger = typeof logger;

