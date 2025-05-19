// src/middleware.ts
// Supabase認証ミドルウェア

import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/types";
import { logger } from "@/lib/logger";

/**
 * 認証状態を確認するミドルウェア
 * - セッションのリフレッシュ
 * - 保護されたルートへのアクセス制御
 */
export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();

    // 環境変数チェック - Supabase接続情報がない場合は処理をスキップ
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      logger.warn(
        "Supabase環境変数が設定されていません。認証機能は動作しません。",
      );
      return response;
    }

    const supabase = createMiddlewareClient<Database>({
      req: request,
      res: response,
    });

    // セッションの更新
    await supabase.auth.getSession();

    // 保護されたルートの確認
    // /dashboard以下のルートにアクセスするにはログインが必要
    const { pathname } = request.nextUrl;
    if (pathname.startsWith("/dashboard")) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // セッションがない場合はログインページにリダイレクト
      if (!session) {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    return response;
  } catch (error) {
    logger.error("ミドルウェアエラー:", error);
    return NextResponse.next();
  }
}

// ミドルウェアを適用するパス - APIパスを除外して最初の問題を回避
export const config = {
  matcher: [
    // 認証が必要なルート
    "/dashboard/:path*",
    // 認証関連
    "/login",
    "/register",
  ],
};
