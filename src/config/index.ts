// src/config/index.ts
// クライアント専用設定ファイル - Phase 3統合完了
// セキュリティ：サーバー環境変数のクライアントサイドアクセスを完全防止

// 🔐 クライアント専用環境変数インポート・エクスポート
import { clientEnv } from './client';
export { clientEnv, type ClientEnv } from './client';

// サーバー環境変数は別途 '@/config/server' から直接インポートしてください
// export { serverEnv, type ServerEnv } from './server'; // 削除: クライアントバンドル防止

// 🚀 アプリケーション設定（クライアント専用）
export const AppConfig = {
  // 🌐 サーバーポート設定（クライアントサイドでは参考値）
  servers: {
    next: {
      port: 3003, // デフォルト値
      url: 'http://localhost:3003'
    },
    socketio: {
      port: 8080,
      url: 'http://127.0.0.1:8080'
    },
    websocket: {
      port: 8081,
      url: 'ws://127.0.0.1:8081'
    }
  },

  // 🚀 MASTRA設定（クライアント用デフォルト）
  mastra: {
    enabled: true,
    model: 'gpt-4o',
    timeout: 30000
  },

  // 📊 外部API設定（クライアント用）
  external: {
    binance: {
      wsBaseUrl: 'wss://stream.binance.com:9443'
    }
  },

  // 🛠️ 開発環境設定
  development: {
    enableDebugLogs: process.env.NODE_ENV === 'development',
    mockMode: false,
    hotReload: process.env.NODE_ENV === 'development'
  },

  // 📈 パフォーマンス設定
  performance: {
    socketTimeout: 30000,
    reconnectDelay: 5000,
    maxRetries: 5,
    requestTimeout: 10000
  }
} as const;

// 型エクスポート
export type AppConfigType = typeof AppConfig;

// 🌍 環境判定ユーティリティ
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// 📋 設定検証関数（クライアント専用）
export function validateConfig(): boolean {
  try {
    // クライアント環境変数は自動で検証済み
    console.log('✅ クライアント設定検証完了:', {
      supabaseUrl: !!clientEnv.SUPABASE_URL,
      supabaseAnonKey: !!clientEnv.SUPABASE_ANON_KEY,
      binanceWsUrl: !!clientEnv.BINANCE_WS_URL,
      hubWsUrl: !!clientEnv.HUB_WS_URL
    });
    return true;
  } catch (error) {
    console.error('❌ クライアント設定検証失敗:', error);
    return false;
  }
} 