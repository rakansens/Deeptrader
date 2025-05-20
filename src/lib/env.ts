// src/lib/env.ts
"use strict";

/**
 * アプリケーションで使用する環境変数を管理するモジュール
 * 必須変数が存在しない場合、明確なエラーを投げる
 * 
 * 注意: このファイルは直接使用せず、各サービスファイルで環境変数を直接参照することを推奨
 */

// 環境変数を安全に取得する関数
// サーバーサイドでは存在しない場合にエラーをスロー
// クライアントサイドでは警告を出力して空文字列を返す
function getEnv(name: string, isRequired: boolean = true): string {
  const value = process.env[name];
  if (!value && isRequired) {
    // クライアントサイドでのエラーを防ぐため、コンソールエラーを出力するだけにする
    if (typeof window !== 'undefined') {
      console.warn(`Environment variable ${name} is not defined`);
      return '';
    } else {
      throw new Error(`Environment variable ${name} is not defined`);
    }
  }
  return value || '';
}

// 注意: 以下の変数はsupabase.tsで直接使用されなくなりました
// 他のファイルでの参照のために残しています

// クライアントサイドで使用する環境変数
export const NEXT_PUBLIC_SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL", false);
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", false);

// サーバーサイドでのみ使用する環境変数
export const SUPABASE_SERVICE_ROLE_KEY = typeof window === 'undefined' 
  ? getEnv("SUPABASE_SERVICE_ROLE_KEY") 
  : '';

export const BINANCE_BASE_URL = process.env.BINANCE_BASE_URL ?? "https://api.binance.com";
export const BITGET_BASE_URL = process.env.BITGET_BASE_URL ?? "https://api.bitget.com";
export const BITGET_API_KEY = process.env.BITGET_API_KEY ?? "";
export const BLOCKCHAIR_BASE_URL = process.env.BLOCKCHAIR_BASE_URL ?? "https://api.blockchair.com/ethereum";
export const BLOCKCHAIR_API_KEY = process.env.BLOCKCHAIR_API_KEY ?? "";
export const SENTIMENT_API_URL = process.env.SENTIMENT_API_URL ?? "https://api.alternative.me/fng/";
export const SENTIMENT_API_KEY = process.env.SENTIMENT_API_KEY ?? "";

export const NEWS_API_URL = process.env.NEWS_API_URL ?? "https://newsapi.org/v2/everything";
export const NEWS_API_KEY = process.env.NEWS_API_KEY ?? "";

export const COINGLASS_BASE_URL = process.env.COINGLASS_BASE_URL ??
  "https://open-api.coinglass.com/public/v2";
export const COINGLASS_API_KEY = process.env.COINGLASS_API_KEY ?? "";


