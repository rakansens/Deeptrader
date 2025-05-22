// src/utils/supabase/middleware.ts
// ミドルウェア用のSupabaseクライアント

import { createServerClient as supabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types';

// 環境変数を一元管理
const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;

/**
 * ミドルウェアでセッションを更新する
 * 
 * @param request - Next.jsのリクエストオブジェクト
 * @returns 認証状態に基づいた適切なレスポンス
 */
export async function updateSession(request: NextRequest) {
  // レスポンスの初期化 - 事前に生成するパターン
  // 注: セッション取得後にレスポンスを生成するパターンも有効です
  // その場合は getSession() の後に response = NextResponse.next() を実行します
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = supabaseServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // NextResponseのCookieにのみ設定
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // NextResponseのCookieから削除
          response.cookies.delete(name);
        },
      },
    }
  );

  // 重要: createServerClientとgetSessionの間にロジックを挟まない
  // 認証状態の確認
  const { data: { session } } = await supabase.auth.getSession();

  // 認証が必要なルートへのアクセス制御
  const { pathname } = request.nextUrl;
  if (
    !session &&
    pathname.startsWith('/dashboard')
  ) {
    // ログインページにリダイレクト
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // レスポンスを返す - 必ずここで返したレスポンスを使用すること
  return response;
} 