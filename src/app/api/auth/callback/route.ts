// src/app/api/auth/callback/route.ts
// Supabase認証コールバックハンドラー

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

/**
 * Supabase認証コールバック処理
 * ユーザー認証後のリダイレクト処理を行う
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // セッションの交換処理
    await supabase.auth.exchangeCodeForSession(code);
  }

  // ダッシュボードにリダイレクト
  return NextResponse.redirect(new URL('/dashboard', request.url));
} 