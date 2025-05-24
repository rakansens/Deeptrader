/**
 * ロギングユーティリティ
 * 開発時にコンソールへのログ出力を制御する
 */

import { AppConfig } from '@/config';
import { getCurrentISOTimestamp, compareTimestamps } from './date-utils';

// ログレベル定義
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// ログコンテキスト
export interface LogContext {
  requestId?: string;
  userId?: string;
  component?: string;
  agentType?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
  // 🔧 動的プロパティを許可（後方互換性確保）
  [key: string]: any;
}

// パフォーマンスメトリクス
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage?: NodeJS.MemoryUsage;
  timestamp: string;
  operation: string;
  success: boolean;
}

// ログエントリー
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: any;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private metricsBuffer: PerformanceMetrics[] = [];
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 1000;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // 📊 パフォーマンス監視
  startTimer(operation: string): () => PerformanceMetrics {
    const startTime = Date.now();
    const startMemory = process.memoryUsage?.();

    return () => {
      const executionTime = Date.now() - startTime;
      const endMemory = process.memoryUsage?.();

      const metrics: PerformanceMetrics = {
        executionTime,
        memoryUsage: endMemory,
        timestamp: getCurrentISOTimestamp(),
        operation,
        success: true
      };

      this.addMetrics(metrics);
      
      if (executionTime > AppConfig.performance.requestTimeout) {
        this.warn(`⏱️ 処理時間が閾値を超過: ${operation}`, { 
          operation, 
          metadata: { executionTime } 
        });
      }

      return metrics;
    };
  }

  // メトリクス追加
  private addMetrics(metrics: PerformanceMetrics) {
    this.metricsBuffer.push(metrics);
    
    if (this.metricsBuffer.length > this.MAX_BUFFER_SIZE) {
      this.metricsBuffer = this.metricsBuffer.slice(-this.MAX_BUFFER_SIZE / 2);
    }
  }

  // ログエントリー追加
  private addLogEntry(entry: LogEntry) {
    this.logBuffer.push(entry);
    
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer = this.logBuffer.slice(-this.MAX_BUFFER_SIZE / 2);
    }
  }

  // 基本ログメソッド
  private log(level: LogLevel, message: string, context?: LogContext, error?: any) {
    const timestamp = getCurrentISOTimestamp();
    const entry: LogEntry = {
      level,
      message,
      timestamp,
      context,
      error,
      stack: error?.stack
    };

    this.addLogEntry(entry);

    // コンソール出力（開発環境）
    if (AppConfig.development.enableDebugLogs) {
      const emoji = this.getLevelEmoji(level);
      const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`${emoji} ${message}${contextStr}`);
          break;
        case LogLevel.INFO:
          console.info(`${emoji} ${message}${contextStr}`);
          break;
        case LogLevel.WARN:
          console.warn(`${emoji} ${message}${contextStr}`, error || '');
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(`${emoji} ${message}${contextStr}`, error || '');
          break;
      }
    }
  }

  // レベル別ユーティリティメソッド
  debug(message: string, context?: LogContext | any) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext | any) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext | any, error?: any) {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, context?: LogContext | any, error?: any) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  critical(message: string, context?: LogContext | any, error?: any) {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  // 🚀 MASTRA特化ログ
  mastra(operation: string, agentType: string, message: string, context?: Partial<LogContext>) {
    this.info(`🤖 MASTRA ${agentType}: ${operation}`, {
      component: 'mastra',
      agentType,
      operation,
      ...context
    });
  }

  // 🔌 Socket.IO特化ログ
  socket(event: string, message: string, context?: Partial<LogContext>) {
    this.debug(`🔌 Socket.IO: ${event}`, {
      component: 'socketio',
      operation: event,
      ...context
    });
  }

  // 📡 API特化ログ
  api(method: string, endpoint: string, status: number, duration: number, context?: Partial<LogContext>) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `📡 API ${method} ${endpoint} - ${status} (${duration}ms)`, {
      component: 'api',
      operation: `${method} ${endpoint}`,
      duration,
      metadata: { status },
      ...context
    });
  }

  // 🎯 UI操作特化ログ
  uiOperation(operation: string, success: boolean, context?: Partial<LogContext>) {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    const emoji = success ? '✅' : '⚠️';
    this.log(level, `${emoji} UI操作: ${operation}`, {
      component: 'ui',
      operation,
      metadata: { success },
      ...context
    });
  }

  // 📊 統計情報取得
  getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metricsBuffer.filter(m => m.operation === operation);
    }
    return [...this.metricsBuffer];
  }

  getAverageExecutionTime(operation: string): number {
    const metrics = this.getMetrics(operation);
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, m) => sum + m.executionTime, 0);
    return total / metrics.length;
  }

  getErrorRate(operation: string): number {
    const metrics = this.getMetrics(operation);
    if (metrics.length === 0) return 0;
    
    const errors = metrics.filter(m => !m.success).length;
    return errors / metrics.length;
  }

  // 📋 ログ取得
  getLogs(level?: LogLevel, component?: string): LogEntry[] {
    let logs = [...this.logBuffer];
    
    if (level !== undefined) {
      logs = logs.filter(l => l.level >= level);
    }
    
    if (component) {
      logs = logs.filter(l => l.context?.component === component);
    }
    
    return logs.sort((a, b) => compareTimestamps(a.timestamp, b.timestamp));
  }

  // 🧹 ログ・メトリクスクリア
  clearLogs() {
    this.logBuffer = [];
    this.metricsBuffer = [];
    this.info('🧹 ログ・メトリクスをクリアしました');
  }

  // ヘルパーメソッド
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🐛';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      case LogLevel.CRITICAL: return '🚨';
      default: return 'ℹ️';
    }
  }

  // 健康状態チェック
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      totalLogs: number;
      errorRate: number;
      averageResponseTime: number;
      memoryUsage?: NodeJS.MemoryUsage;
    };
  } {
    const recentLogs = this.getLogs().slice(0, 100);
    const errors = recentLogs.filter(l => l.level >= LogLevel.ERROR).length;
    const errorRate = recentLogs.length > 0 ? errors / recentLogs.length : 0;
    
    const recentMetrics = this.metricsBuffer.slice(-50);
    const avgResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length 
      : 0;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (errorRate > 0.3 || avgResponseTime > AppConfig.performance.requestTimeout) {
      status = 'critical';
    } else if (errorRate > 0.1 || avgResponseTime > AppConfig.performance.requestTimeout / 2) {
      status = 'warning';
    }

    return {
      status,
      metrics: {
        totalLogs: this.logBuffer.length,
        errorRate,
        averageResponseTime: avgResponseTime,
        memoryUsage: process.memoryUsage?.()
      }
    };
  }
}

// シングルトンエクスポート
export const logger = Logger.getInstance();

// 後方互換性のための既存メソッド維持
export { logger as default };

