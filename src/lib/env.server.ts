// src/lib/env.server.ts
"use strict";

/**
 * サーバーサイドでのみ使用する環境変数を管理するモジュール
 * Zod で定義したスキーマを用いて検証を行う
 * このファイルはサーバーサイドでのみ使用されるべきです
 */

import { z } from "zod";
import { logger } from "@/lib/logger";

// サーバーサイドでのみ実行されることを確認
if (typeof window !== "undefined") {
  throw new Error(
    "❌ このモジュールはサーバーサイドでのみ使用できます。クライアントサイドでの使用は避けてください。"
  );
}

// サーバー環境変数スキーマ
const serverEnvSchema = z.object({
  // Supabase関連
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  
  // API関連
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("gpt-4o"),
  
  // その他のサービス
  BINANCE_BASE_URL: z.string().url().default("https://api.binance.com"),
  BITGET_BASE_URL: z.string().url().default("https://api.bitget.com"),
  BITGET_API_KEY: z.string().optional(),
  BLOCKCHAIR_BASE_URL: z.string().url().default("https://api.blockchair.com/ethereum"),
  BLOCKCHAIR_API_KEY: z.string().optional(),
  SENTIMENT_API_URL: z.string().url().default("https://api.alternative.me/fng/"),
  SENTIMENT_API_KEY: z.string().optional(),
  NEWS_API_URL: z.string().url().default("https://newsapi.org/v2/everything"),
  NEWS_API_KEY: z.string().optional(),
  COINGLASS_BASE_URL: z.string().url().default("https://open-api.coinglass.com/public/v2"),
  COINGLASS_API_KEY: z.string().optional(),
  
  // デバッグ設定
  DEBUG_MODE: z.enum(["true", "false"]).default("false").transform(v => v === "true"),
});

// スキーマに基づいて環境変数を検証
const serverEnv = serverEnvSchema.safeParse(process.env);

// 環境変数の値を格納する変数
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

// 検証に失敗した場合はエラーメッセージを表示して例外をスロー
if (!serverEnv.success) {
  logger.error(
    "❌ サーバー環境変数の検証に失敗しました。.env.localファイルを確認してください:",
    serverEnv.error.format()
  );
  
  // 開発環境でも本番環境でも例外をスローして、環境変数の設定漏れに気づかせる
  throw new Error(
    "環境変数の検証に失敗しました。.env.local ファイルに必要な環境変数を設定してください。"
  );
} else {
  // 検証成功時は環境変数の値を使用（型安全な方法で）
  const {
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    OPENAI_API_KEY: openaiKey,
    AI_MODEL: aiModel,
    BINANCE_BASE_URL: binanceUrl,
    BITGET_BASE_URL: bitgetUrl,
    BITGET_API_KEY: bitgetKey,
    BLOCKCHAIR_BASE_URL: blockchairUrl,
    BLOCKCHAIR_API_KEY: blockchairKey,
    SENTIMENT_API_URL: sentimentUrl,
    SENTIMENT_API_KEY: sentimentKey,
    NEWS_API_URL: newsUrl,
    NEWS_API_KEY: newsKey,
    COINGLASS_BASE_URL: coinglassUrl,
    COINGLASS_API_KEY: coinglassKey
  } = serverEnv.data;
  
  // 型安全な変数への代入
  SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
  OPENAI_API_KEY = openaiKey ?? "";
  AI_MODEL = aiModel;
  BINANCE_BASE_URL = binanceUrl;
  BITGET_BASE_URL = bitgetUrl;
  BITGET_API_KEY = bitgetKey ?? "";
  BLOCKCHAIR_BASE_URL = blockchairUrl;
  BLOCKCHAIR_API_KEY = blockchairKey ?? "";
  SENTIMENT_API_URL = sentimentUrl;
  SENTIMENT_API_KEY = sentimentKey ?? "";
  NEWS_API_URL = newsUrl;
  NEWS_API_KEY = newsKey ?? "";
  COINGLASS_BASE_URL = coinglassUrl;
  COINGLASS_API_KEY = coinglassKey ?? "";
}

// 変数のエクスポート
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
