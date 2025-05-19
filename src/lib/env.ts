// src/lib/env.ts
"use strict";

/**
 * アプリケーションで使用する環境変数を管理するモジュール
 * 必須変数が存在しない場合、明確なエラーを投げる
 */

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not defined`);
  }
  return value;
}

export const NEXT_PUBLIC_SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

export const BINANCE_BASE_URL = process.env.BINANCE_BASE_URL ?? "https://api.binance.com";
export const BITGET_BASE_URL = process.env.BITGET_BASE_URL ?? "https://api.bitget.com";
export const BITGET_API_KEY = process.env.BITGET_API_KEY ?? "";
export const BLOCKCHAIR_BASE_URL = process.env.BLOCKCHAIR_BASE_URL ?? "https://api.blockchair.com/ethereum";
export const BLOCKCHAIR_API_KEY = process.env.BLOCKCHAIR_API_KEY ?? "";
export const SENTIMENT_API_URL = process.env.SENTIMENT_API_URL ?? "https://api.alternative.me/fng/";
export const SENTIMENT_API_KEY = process.env.SENTIMENT_API_KEY ?? "";


