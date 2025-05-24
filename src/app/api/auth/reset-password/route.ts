import { NextResponse } from "next/server";
import { resetPassword } from "@/infrastructure/supabase/auth-service";
import { createSuccessNextResponse, createErrorNextResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return createErrorNextResponse(
        "メールアドレスは必須です",
        "パスワードリセットにはメールアドレスが必要です",
        400
      );
    }

    await resetPassword(email);
    return createSuccessNextResponse({
      message: "リセットメールを送信しました",
      mode: 'fallback'
    });
  } catch (err) {
    return createErrorNextResponse(
      err instanceof Error ? err : new Error("Unknown error"),
      "パスワードリセットメールの送信に失敗しました",
      500
    );
  }
}
