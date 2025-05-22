'use server';

// src/utils/supabase/server.ts
// 最もシンプルなサーバークライアント実装

import { createServerClient as supabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types';

export async function createServerClient() {
  const cookieStore = cookies();
  
  return supabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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