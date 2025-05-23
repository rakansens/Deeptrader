// src/config/index.ts
// 統一設定ファイル - ポート競合解決とサービス整理

export const AppConfig = {
  // 🌐 サーバーポート設定
  servers: {
    next: {
      port: parseInt(process.env.PORT || '3000'),
      url: `http://localhost:${process.env.PORT || '3000'}`
    },
    socketio: {
      port: parseInt(process.env.SOCKETIO_PORT || '8080'),
      url: `http://127.0.0.1:${process.env.SOCKETIO_PORT || '8080'}`
    },
    websocket: {
      port: parseInt(process.env.WEBSOCKET_PORT || '8081'), // ポート分離
      url: `ws://127.0.0.1:${process.env.WEBSOCKET_PORT || '8081'}`
    }
  },

  // 🔐 認証設定
  auth: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret'
  },

  // 🚀 MASTRA設定
  mastra: {
    enabled: process.env.MASTRA_ENABLED !== 'false',
    model: process.env.MASTRA_MODEL || 'gpt-4o',
    timeout: parseInt(process.env.MASTRA_TIMEOUT || '30000')
  },

  // 📊 外部API設定
  external: {
    binance: {
      wsBaseUrl: process.env.NEXT_PUBLIC_BINANCE_WS_BASE_URL || 'wss://stream.binance.com:9443'
    }
  },

  // 🛠️ 開発環境設定
  development: {
    enableDebugLogs: process.env.NODE_ENV === 'development',
    mockMode: process.env.MOCK_MODE === 'true',
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

// 設定検証
export function validateConfig(): boolean {
  const required = [
    AppConfig.auth.openaiApiKey,
  ];
  
  const missing = required.filter(val => !val);
  
  if (missing.length > 0) {
    console.error('❌ 必須設定が不足:', { missingOpenAI: !AppConfig.auth.openaiApiKey });
    return false;
  }
  
  console.log('✅ 設定検証完了:', {
    nextPort: AppConfig.servers.next.port,
    socketioPort: AppConfig.servers.socketio.port,
    websocketPort: AppConfig.servers.websocket.port,
    mastraEnabled: AppConfig.mastra.enabled
  });
  
  return true;
}

// 環境別設定
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test'; 