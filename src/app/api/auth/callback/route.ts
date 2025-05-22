// src/app/api/auth/callback/route.ts
// Supabase認証コールバックハンドラー（@supabase/ssr を使用）

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/utils/supabase/route-handler";
import { logger } from "@/lib/logger";

/**
 * Supabase認証コールバック処理
 * ユーザー認証後のリダイレクト処理を行う
 */
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (code) {
      const supabase = await createRouteHandlerClient();
      // セッションの交換処理
      await supabase.auth.exchangeCodeForSession(code);
    }

    // ダッシュボードにリダイレクト
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    logger.error("認証コールバックエラー:", error);
    // エラーページにリダイレクト
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }
}
