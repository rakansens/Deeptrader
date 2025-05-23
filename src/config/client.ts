// src/config/client.ts
// クライアント専用環境変数 - Phase 3統合
// セキュリティ: NEXT_PUBLIC_プレフィックスのみ（機密情報なし）

import { z } from "zod";
import { logger } from "@/lib/logger";

// クライアント環境変数スキーマ（NEXT_PUBLIC_プレフィックスのみ）
const clientEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  BINANCE_WS_URL: z
    .string()
    .url()
    .default('wss://stream.binance.com:9443'),
  HUB_WS_URL: z.string().url().default('ws://localhost:3000/ws'),
});

// Next.jsクライアントバンドル用の環境変数収集
const rawClientEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  BINANCE_WS_URL: process.env.NEXT_PUBLIC_BINANCE_WS_BASE_URL,
  HUB_WS_URL: process.env.NEXT_PUBLIC_HUB_WS_URL,
};

// スキーマ検証実行
const clientEnvResult = clientEnvSchema.safeParse(rawClientEnv);

// 検証失敗時のエラーハンドリング
if (!clientEnvResult.success) {
  logger.error("❌ クライアント環境変数の検証に失敗しました:", clientEnvResult.error.format());
  throw new Error(
    "環境変数の検証に失敗しました。.env.local ファイルのNEXT_PUBLIC_*変数を確認してください。"
  );
}

// 型安全なクライアント環境変数エクスポート
export const clientEnv = clientEnvResult.data;

// 型エクスポート
export type ClientEnv = typeof clientEnv; 