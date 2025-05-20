// src/lib/supabase.ts
// Supabaseクライアントの初期化

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types";

// 環境変数から直接取得（クライアントサイドでも動作するように）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prpktdgudkhkvlaxfelf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycGt0ZGd1ZGtoa3ZsYXhmZWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MzQ1NjQsImV4cCI6MjA2MzExMDU2NH0.GpfC1yjceni-2JDSM68KnMpRXOInqXnW3sScBHozIU8';

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
