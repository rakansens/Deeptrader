// src/lib/env.ts
"use strict";

/**
 * アプリケーションで使用する環境変数を管理するモジュール
 * Zod で定義したスキーマを用いて検証を行う
 */

import { z } from "zod";

// 環境変数スキーマ
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("gpt-4o"),

  BINANCE_BASE_URL: z.string().url().default("https://api.binance.com"),
  BITGET_BASE_URL: z.string().url().default("https://api.bitget.com"),
  BITGET_API_KEY: z.string().optional(),
  BLOCKCHAIR_BASE_URL: z
    .string()
    .url()
    .default("https://api.blockchair.com/ethereum"),
  BLOCKCHAIR_API_KEY: z.string().optional(),
  SENTIMENT_API_URL: z
    .string()
    .url()
    .default("https://api.alternative.me/fng/"),
  SENTIMENT_API_KEY: z.string().optional(),
  NEWS_API_URL: z.string().url().default("https://newsapi.org/v2/everything"),
  NEWS_API_KEY: z.string().optional(),
  COINGLASS_BASE_URL: z
    .string()
    .url()
    .default("https://open-api.coinglass.com/public/v2"),
  COINGLASS_API_KEY: z.string().optional(),
});

// スキーマに基づいて環境変数を検証
const env = envSchema.parse(process.env);

// 変数のエクスポート
export const NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
export const OPENAI_API_KEY = env.OPENAI_API_KEY ?? "";
export const AI_MODEL = env.AI_MODEL;

export const BINANCE_BASE_URL = env.BINANCE_BASE_URL;
export const BITGET_BASE_URL = env.BITGET_BASE_URL;
export const BITGET_API_KEY = env.BITGET_API_KEY ?? "";
export const BLOCKCHAIR_BASE_URL = env.BLOCKCHAIR_BASE_URL;
export const BLOCKCHAIR_API_KEY = env.BLOCKCHAIR_API_KEY ?? "";
export const SENTIMENT_API_URL = env.SENTIMENT_API_URL;
export const SENTIMENT_API_KEY = env.SENTIMENT_API_KEY ?? "";
export const NEWS_API_URL = env.NEWS_API_URL;
export const NEWS_API_KEY = env.NEWS_API_KEY ?? "";
export const COINGLASS_BASE_URL = env.COINGLASS_BASE_URL;
export const COINGLASS_API_KEY = env.COINGLASS_API_KEY ?? "";
