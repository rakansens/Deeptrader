// src/lib/env.client.ts
"use strict";

/**
 * クライアントサイドで使用する環境変数を管理するモジュール
 * Zod で定義したスキーマを用いて検証を行う
 */

import { z } from "zod";
import { logger } from "@/lib/logger";

// クライアント環境変数スキーマ（NEXT_PUBLIC_プレフィックスのみ）
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  
  // その他のクライアントサイドで使用する環境変数
  NEXT_PUBLIC_API_BASE_URL: z.string().default("/api"),
  NEXT_PUBLIC_BASE_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_DEBUG_MODE: z.enum(["true", "false"]).default("false").transform(v => v === "true"),
  
  NEXT_PUBLIC_BITGET_API_URL: z.string().url().default("https://api.bitget.com"),
  NEXT_PUBLIC_BITGET_WS_URL: z.string().url().default("wss://ws.bitget.com/v2/ws/public"),
  NEXT_PUBLIC_ENABLE_DEMO_MODE: z.enum(["true", "false"]).default("false").transform(v => v === "true"),
});

// Next.js のクライアントバンドルでは `process.env` 全体が存在しないため、
// 個別に埋め込まれた定数を集めてスキーマ検証する
const rawClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE,
  NEXT_PUBLIC_BITGET_API_URL: process.env.NEXT_PUBLIC_BITGET_API_URL,
  NEXT_PUBLIC_BITGET_WS_URL: process.env.NEXT_PUBLIC_BITGET_WS_URL,
  NEXT_PUBLIC_ENABLE_DEMO_MODE: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE,
};

const clientEnv = clientEnvSchema.safeParse(rawClientEnv);

// 環境変数の値を格納する変数
let NEXT_PUBLIC_SUPABASE_URL: string;
let NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
let NEXT_PUBLIC_API_BASE_URL: string;
let NEXT_PUBLIC_BASE_URL: string;
let NEXT_PUBLIC_DEBUG_MODE: boolean;
let NEXT_PUBLIC_BITGET_API_URL: string;
let NEXT_PUBLIC_BITGET_WS_URL: string;
let NEXT_PUBLIC_ENABLE_DEMO_MODE: boolean;

// 検証に失敗した場合はエラーメッセージを表示して例外をスロー
if (!clientEnv.success) {
  logger.error("❌ .env.local の環境変数が不足しています:", clientEnv.error.format());
  
  // 開発環境でも本番環境でも例外をスローして、環境変数の設定漏れに気づかせる
  throw new Error(
    "環境変数の検証に失敗しました。.env.local ファイルに必要な環境変数を設定してください。"
  );
} else {
  // 検証成功時は環境変数の値を使用
  const {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
    NEXT_PUBLIC_BASE_URL: baseUrl,
    NEXT_PUBLIC_DEBUG_MODE: debugMode,
    NEXT_PUBLIC_BITGET_API_URL: bitgetApiUrl,
    NEXT_PUBLIC_BITGET_WS_URL: bitgetWsUrl,
    NEXT_PUBLIC_ENABLE_DEMO_MODE: enableDemoMode
  } = clientEnv.data;
  
  // 型安全な変数への代入
  NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
  NEXT_PUBLIC_API_BASE_URL = apiBaseUrl;
  NEXT_PUBLIC_BASE_URL = baseUrl;
  NEXT_PUBLIC_DEBUG_MODE = debugMode;
  NEXT_PUBLIC_BITGET_API_URL = bitgetApiUrl;
  NEXT_PUBLIC_BITGET_WS_URL = bitgetWsUrl;
  NEXT_PUBLIC_ENABLE_DEMO_MODE = enableDemoMode;
}

// 変数のエクスポート
export {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_DEBUG_MODE,
  NEXT_PUBLIC_BITGET_API_URL,
  NEXT_PUBLIC_BITGET_WS_URL,
  NEXT_PUBLIC_ENABLE_DEMO_MODE
};
