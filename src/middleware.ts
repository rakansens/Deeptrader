// src/middleware.ts
// Supabase認証ミドルウェア（@supabase/ssr を使用）

import { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase';
import { logger } from '@/lib/logger';

/**
 * 認証状態を確認するミドルウェア
 * - セッションのリフレッシュ
 * - 保護されたルートへのアクセス制御
 */
export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    logger.error("ミドルウェアエラー:", error);
    return Response.json(
      { success: false, message: "Authentication failed" },
      { status: 500 }
    );
  }
}

// ミドルウェアを適用するパス
export const config = {
  matcher: [
    // 認証が必要なルート
    "/dashboard/:path*",
    // 認証関連
    "/login",
    "/register",
  ],
};
