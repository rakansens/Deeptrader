'use client';

// src/utils/supabase/client.ts
// 最もシンプルなブラウザクライアント実装

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types';
import { clientEnv } from '@/config';

// シングルトンインスタンスを保持
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }
  
  browserClient = createBrowserClient<Database>(
    clientEnv.SUPABASE_URL,
    clientEnv.SUPABASE_ANON_KEY
  );
  
  return browserClient;
} 