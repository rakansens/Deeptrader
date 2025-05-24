// src/lib/error-handler.ts
// 統一エラーハンドラー - Phase 1: エラー処理標準化

import { AppConfig } from '@/config';
import { logger } from './logger';
import { getCurrentISOTimestamp } from './date-utils';

// エラー型定義
export enum ErrorType {
  MASTRA_ERROR = 'MASTRA_ERROR',
  SOCKETIO_ERROR = 'SOCKETIO_ERROR',
  API_ERROR = 'API_ERROR',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: AppError;
  requestId?: string;
}

// 統一エラーハンドラークラス
export class ErrorHandler {
  private static instance: ErrorHandler;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // エラー作成
  createError(
    type: ErrorType,
    message: string,
    details?: any,
    context?: Record<string, any>
  ): AppError {
    return {
      type,
      message,
      details,
      context,
      timestamp: getCurrentISOTimestamp(),
      stack: AppConfig.development.enableDebugLogs ? new Error().stack : undefined
    };
  }

  // MASTRA関連エラー
  handleMastraError(error: unknown, context?: Record<string, any>): AppError {
    const message = error instanceof Error ? error.message : String(error);
    
    // MASTRAエラーの詳細分析
    let details = null;
    if (message.includes('quota')) {
      details = { type: 'quota_exceeded', suggestion: 'OpenAI API課金を確認してください' };
    } else if (message.includes('ai/test')) {
      details = { type: 'module_error', suggestion: 'ai-test-fallback.jsを確認してください' };
    } else if (message.includes('Agent')) {
      details = { type: 'agent_error', suggestion: 'エージェント初期化を確認してください' };
    }

    console.error('🚨 MASTRAエラー:', { message, details, context });
    
    return this.createError(ErrorType.MASTRA_ERROR, message, details, context);
  }

  // Socket.IO関連エラー
  handleSocketIOError(error: unknown, context?: Record<string, any>): AppError {
    const message = error instanceof Error ? error.message : String(error);
    
    let details = null;
    if (message.includes('EADDRINUSE')) {
      details = { 
        type: 'port_conflict', 
        port: AppConfig.servers.socketio.port,
        suggestion: 'ポート使用中です。プロセスを確認してください' 
      };
    } else if (message.includes('ECONNREFUSED')) {
      details = { 
        type: 'connection_refused', 
        suggestion: 'Socket.IOサーバーが起動していません' 
      };
    }

    console.error('🔌 Socket.IOエラー:', { message, details, context });
    
    return this.createError(ErrorType.SOCKETIO_ERROR, message, details, context);
  }

  // WebSocketエラー
  handleWebSocketError(error: unknown, context?: Record<string, any>): AppError {
    const message = error instanceof Error ? error.message : String(error);
    
    console.error('🌐 WebSocketエラー:', { message, context });
    
    return this.createError(ErrorType.WEBSOCKET_ERROR, message, error, context);
  }

  // API関連エラー
  handleAPIError(error: unknown, context?: Record<string, any>): AppError {
    const message = error instanceof Error ? error.message : String(error);
    
    console.error('📡 APIエラー:', { message, context });
    
    return this.createError(ErrorType.API_ERROR, message, error, context);
  }

  // バリデーションエラー
  handleValidationError(message: string, details?: any, context?: Record<string, any>): AppError {
    console.error('✅ バリデーションエラー:', { message, details, context });
    
    return this.createError(ErrorType.VALIDATION_ERROR, message, details, context);
  }

  // 汎用エラー処理
  handleError(error: unknown, type: ErrorType = ErrorType.UNKNOWN_ERROR, context?: Record<string, any>): AppError {
    switch (type) {
      case ErrorType.MASTRA_ERROR:
        return this.handleMastraError(error, context);
      case ErrorType.SOCKETIO_ERROR:
        return this.handleSocketIOError(error, context);
      case ErrorType.WEBSOCKET_ERROR:
        return this.handleWebSocketError(error, context);
      case ErrorType.API_ERROR:
        return this.handleAPIError(error, context);
      default:
        const message = error instanceof Error ? error.message : String(error);
        console.error('❓ 不明なエラー:', { message, context });
        return this.createError(type, message, error, context);
    }
  }

  // レスポンス作成
  createErrorResponse(appError: AppError, requestId?: string): ErrorResponse {
    return {
      success: false,
      error: appError,
      requestId
    };
  }

  // ユーザーフレンドリーなエラーメッセージ
  getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.MASTRA_ERROR:
        if (error.details?.type === 'quota_exceeded') {
          return 'OpenAI APIのクォータ制限に達しました。課金設定を確認してください。';
        }
        return 'AIエージェントの処理中にエラーが発生しました。しばらく待ってからお試しください。';
      
      case ErrorType.SOCKETIO_ERROR:
        if (error.details?.type === 'port_conflict') {
          return 'リアルタイム通信サーバーの起動に失敗しました。管理者にお問い合わせください。';
        }
        return 'リアルタイム通信に問題が発生しました。ページを再読み込みしてください。';
      
      case ErrorType.WEBSOCKET_ERROR:
        return 'チャートデータの通信に問題が発生しました。接続状況を確認してください。';
      
      case ErrorType.API_ERROR:
        return 'サーバーとの通信に失敗しました。ネットワーク接続を確認してください。';
      
      case ErrorType.VALIDATION_ERROR:
        return '入力データに問題があります。内容を確認して再度お試しください。';
      
      default:
        return '予期しないエラーが発生しました。しばらく待ってからお試しください。';
    }
  }
}

// シングルトンインスタンス
export const errorHandler = ErrorHandler.getInstance(); 