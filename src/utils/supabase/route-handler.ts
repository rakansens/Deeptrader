'use server';

// src/utils/supabase/route-handler.ts
// APIルートハンドラー用のSupabaseクライアント

import { createServerClient as supabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types';
import { clientEnv } from '@/config';

/**
 * APIルートハンドラーからのみ使用するSupabaseクライアントを作成
 */
export async function createRouteHandlerClient() {
  const cookieStore = cookies();
  
  return supabaseServerClient<Database>(
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