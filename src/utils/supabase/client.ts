'use client';

// src/utils/supabase/client.ts
// 最もシンプルなブラウザクライアント実装

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types';

// シングルトンインスタンスを保持
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }
  
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return browserClient;
} 