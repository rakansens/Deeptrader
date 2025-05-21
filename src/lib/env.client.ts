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
});

// Next.js のクライアントバンドルでは `process.env` 全体が存在しないため、
// 個別に埋め込まれた定数を集めてスキーマ検証する
const rawClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const clientEnv = clientEnvSchema.safeParse(rawClientEnv);

// 環境変数の値を格納する変数
let NEXT_PUBLIC_SUPABASE_URL: string;
let NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

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
  } = clientEnv.data;
  
  // 型安全な変数への代入
  NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
}

// 変数のエクスポート
export {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
};
