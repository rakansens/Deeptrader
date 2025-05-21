// src/lib/env.ts
"use strict";

/**
 * アプリケーションで使用する環境変数を管理するモジュール
 * 
 * ⚠️ セキュリティ上の理由から、このファイルは2つに分割されました:
 * - env.client.ts: クライアントサイドで使用する環境変数（NEXT_PUBLIC_プレフィックス）
 * - env.server.ts: サーバーサイドでのみ使用する環境変数（機密情報を含む）
 * 
 * このファイルは後方互換性のために残されていますが、新しいコードでは
 * 適切な方のファイルを直接インポートすることをお勧めします。
 */

// クライアントサイドの環境変数をインポート
export {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
} from './env.client';

// サーバーサイドの環境変数
let SUPABASE_SERVICE_ROLE_KEY: string;
let OPENAI_API_KEY: string;
let AI_MODEL: string;
let BINANCE_BASE_URL: string;
let BITGET_BASE_URL: string;
let BITGET_API_KEY: string;
let BLOCKCHAIR_BASE_URL: string;
let BLOCKCHAIR_API_KEY: string;
let SENTIMENT_API_URL: string;
let SENTIMENT_API_KEY: string;
let NEWS_API_URL: string;
let NEWS_API_KEY: string;
let COINGLASS_BASE_URL: string;
let COINGLASS_API_KEY: string;

// サーバーサイドの環境変数をインポート（サーバーサイドでのみ使用可能）
if (typeof window === 'undefined') {
  // サーバーサイドでは、サーバー環境変数をインポート
  const serverEnv = require('./env.server');
  
  // サーバーサイドの環境変数を設定
  SUPABASE_SERVICE_ROLE_KEY = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  OPENAI_API_KEY = serverEnv.OPENAI_API_KEY;
  AI_MODEL = serverEnv.AI_MODEL;
  BINANCE_BASE_URL = serverEnv.BINANCE_BASE_URL;
  BITGET_BASE_URL = serverEnv.BITGET_BASE_URL;
  BITGET_API_KEY = serverEnv.BITGET_API_KEY;
  BLOCKCHAIR_BASE_URL = serverEnv.BLOCKCHAIR_BASE_URL;
  BLOCKCHAIR_API_KEY = serverEnv.BLOCKCHAIR_API_KEY;
  SENTIMENT_API_URL = serverEnv.SENTIMENT_API_URL;
  SENTIMENT_API_KEY = serverEnv.SENTIMENT_API_KEY;
  NEWS_API_URL = serverEnv.NEWS_API_URL;
  NEWS_API_KEY = serverEnv.NEWS_API_KEY;
  COINGLASS_BASE_URL = serverEnv.COINGLASS_BASE_URL;
  COINGLASS_API_KEY = serverEnv.COINGLASS_API_KEY;
} else {
  // クライアントサイドでは、サーバー環境変数にアクセスしようとするとエラーを表示
  const createServerSideOnlyError = (varName: string) => () => {
    throw new Error(
      `❌ ${varName}はサーバーサイドでのみ使用できます。クライアントサイドでの使用は避けてください。`
    );
  };
  
  // クライアントサイドでは、サーバー環境変数にアクセスしようとするとエラーを表示する関数を定義
  const createServerSideOnlyProxy = (varName: string) => {
    return new Proxy({} as any, {
      get: () => {
        throw new Error(
          `❌ ${varName}はサーバーサイドでのみ使用できます。クライアントサイドでの使用は避けてください。`
        );
      }
    });
  };
  
  // サーバーサイド環境変数のプロキシを作成
  SUPABASE_SERVICE_ROLE_KEY = createServerSideOnlyProxy('SUPABASE_SERVICE_ROLE_KEY') as any;
  OPENAI_API_KEY = createServerSideOnlyProxy('OPENAI_API_KEY') as any;
  AI_MODEL = createServerSideOnlyProxy('AI_MODEL') as any;
  BINANCE_BASE_URL = createServerSideOnlyProxy('BINANCE_BASE_URL') as any;
  BITGET_BASE_URL = createServerSideOnlyProxy('BITGET_BASE_URL') as any;
  BITGET_API_KEY = createServerSideOnlyProxy('BITGET_API_KEY') as any;
  BLOCKCHAIR_BASE_URL = createServerSideOnlyProxy('BLOCKCHAIR_BASE_URL') as any;
  BLOCKCHAIR_API_KEY = createServerSideOnlyProxy('BLOCKCHAIR_API_KEY') as any;
  SENTIMENT_API_URL = createServerSideOnlyProxy('SENTIMENT_API_URL') as any;
  SENTIMENT_API_KEY = createServerSideOnlyProxy('SENTIMENT_API_KEY') as any;
  NEWS_API_URL = createServerSideOnlyProxy('NEWS_API_URL') as any;
  NEWS_API_KEY = createServerSideOnlyProxy('NEWS_API_KEY') as any;
  COINGLASS_BASE_URL = createServerSideOnlyProxy('COINGLASS_BASE_URL') as any;
  COINGLASS_API_KEY = createServerSideOnlyProxy('COINGLASS_API_KEY') as any;
}

// サーバーサイド環境変数のエクスポート
export {
  SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY,
  AI_MODEL,
  BINANCE_BASE_URL,
  BITGET_BASE_URL,
  BITGET_API_KEY,
  BLOCKCHAIR_BASE_URL,
  BLOCKCHAIR_API_KEY,
  SENTIMENT_API_URL,
  SENTIMENT_API_KEY,
  NEWS_API_URL,
  NEWS_API_KEY,
  COINGLASS_BASE_URL,
  COINGLASS_API_KEY
};
