// src/lib/supabase.ts
// Supabaseクライアントの初期化

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types";
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from "./env";

// 環境変数から取得し、存在しない場合は明確なエラーを投げる
const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
}

// 型付きSupabaseクライアントの作成
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// サーバーサイドのみで使用するクライアント（管理者権限）
export const createServiceRoleClient = () => {
  // サーバーサイドでのみ実行されるようにする
  if (typeof window !== 'undefined') {
    console.error('Service role client should only be used on the server');
    return supabase; // クライアントサイドでは通常のクライアントを返す
  }
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient<Database>(supabaseUrl, serviceRoleKey);
};
