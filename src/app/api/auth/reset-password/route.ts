import { NextResponse } from "next/server";
import { resetPassword } from "@/infrastructure/supabase/auth-service";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスは必須です" },
        { status: 400 },
      );
    }

    await resetPassword(email);
    return NextResponse.json({ message: "リセットメールを送信しました" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
