// src/config/server.ts  
// サーバー専用環境変数 - Phase 3統合
// セキュリティ: クライアントサイドでのアクセス完全禁止

import { z } from "zod";
import { logger } from "@/lib/logger";

// クライアントサイドでのインポート防止
if (typeof window !== "undefined") {
  throw new Error(
    "🚫 Server environment variables cannot be accessed on the client side. Use clientEnv instead."
  );
}

// サーバー環境変数スキーマ
const serverEnvSchema = z.object({
  // 🔐 認証・セキュリティ
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  HUB_JWT_SECRET: z.string(),
  
  // 🤖 AI・LLM関連
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("gpt-4o"),
  
  // 📊 外部API関連
  BINANCE_BASE_URL: z.string().url().default("https://api.binance.com"),
  BINANCE_WS_BASE_URL: z.string().url().default('wss://stream.binance.com:9443'),
  BITGET_BASE_URL: z.string().url().default("https://api.bitget.com"),
  BITGET_API_KEY: z.string().optional(),
  
  // 🗄️ データベース・インフラ
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  KAFKA_BROKER_URL: z.string().url().default('http://localhost:9092'),
  
  // 📈 市場データAPI
  BLOCKCHAIR_BASE_URL: z.string().url().default("https://api.blockchair.com/ethereum"),
  BLOCKCHAIR_API_KEY: z.string().optional(),
  SENTIMENT_API_URL: z.string().url().default("https://api.alternative.me/fng/"),
  SENTIMENT_API_KEY: z.string().optional(),
  NEWS_API_URL: z.string().url().default("https://newsapi.org/v2/everything"),
  NEWS_API_KEY: z.string().optional(),
  COINGLASS_BASE_URL: z.string().url().default("https://open-api.coinglass.com/public/v2"),
  COINGLASS_API_KEY: z.string().optional(),
  
  // 🛠️ 開発・デバッグ
  DEBUG_MODE: z.enum(["true", "false"]).default("false").transform(v => v === "true"),
});

// スキーマ検証実行
const serverEnvResult = serverEnvSchema.safeParse(process.env);

// 検証失敗時のエラーハンドリング  
if (!serverEnvResult.success) {
  logger.error(
    "❌ サーバー環境変数の検証に失敗しました。.env.localファイルを確認してください:",
    serverEnvResult.error.format()
  );
  throw new Error(
    "環境変数の検証に失敗しました。.env.local ファイルに必要な環境変数を設定してください。"
  );
}

// 型安全なサーバー環境変数エクスポート
export const serverEnv = serverEnvResult.data;

// 型エクスポート
export type ServerEnv = typeof serverEnv; 