// src/middleware.ts
// Supabase認証ミドルウェア

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

/**
 * 認証状態を確認するミドルウェア
 * - セッションのリフレッシュ
 * - 保護されたルートへのアクセス制御
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req: request, res: response });
  
  // セッションの更新
  await supabase.auth.getSession();
  
  // 保護されたルートの確認
  // /dashboard以下のルートにアクセスするにはログインが必要
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/dashboard')) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    // セッションがない場合はログインページにリダイレクト
    if (!session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  return response;
}

// ミドルウェアを適用するパス
export const config = {
  matcher: [
    // 認証が必要なルート
    '/dashboard/:path*',
    // APIルート
    '/api/:path*',
    // 認証関連
    '/login',
    '/register',
  ],
}; 