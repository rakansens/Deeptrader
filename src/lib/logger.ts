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
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog("info")) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (shouldLog("error")) console.error(...args);
  },
};
export type Logger = typeof logger;

