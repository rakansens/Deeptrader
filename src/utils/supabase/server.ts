'use server';

// src/utils/supabase/server.ts
// 最もシンプルなサーバークライアント実装

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types';
import { clientEnv } from '@/config';

export async function createServerSupabase() {
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    clientEnv.SUPABASE_URL,
    clientEnv.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // ストリーミングレスポンス時はCookieを設定できません
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // ストリーミングレスポンス時はCookieを削除できません
          }
        },
      },
    }
  );
} 