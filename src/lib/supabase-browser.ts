"use client";

// src/lib/supabase-browser.ts
// ブラウザ用Supabaseクライアントのシンプルなラッパー

import { createBrowserClient } from "@/utils/supabase/client-entry";
import type { Database } from "@/types";

// シングルトンインスタンス
let supabaseInstance: ReturnType<typeof createBrowserClient>;

/**
 * ブラウザ環境用のSupabaseクライアントを取得
 */
export function getBrowserSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient();
  }
  return supabaseInstance;
} 