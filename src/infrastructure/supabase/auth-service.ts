import { createClient } from "@/utils/supabase";
import { createServerClient, createServiceRoleClient, createRouteHandlerClient } from "@/utils/supabase/server-entry";
import type { User } from "@supabase/supabase-js";

/**
 * ユーザー登録（クライアントサイド用）
 * @param email - メールアドレス
 * @param password - パスワード
 */
export async function signUp(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

/**
 * ログイン処理（クライアントサイド用）
 * @param email - メールアドレス
 * @param password - パスワード
 */
export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

/**
 * サインアウト（クライアントサイド用）
 */
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * 現在のユーザーを取得（クライアントサイド用）
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * サーバーサイドでユーザーを取得
 */
export async function getServerSideUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("サーバーサイドでのユーザー取得エラー:", error);
      return null;
    }
    return data.user;
  } catch (error) {
    console.error("サーバーコンポーネントでの認証エラー:", error);
    return null;
  }
}

/**
 * APIルートでユーザーを取得
 */
export async function getAPIRouteUser(): Promise<User | null> {
  try {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("APIルートでのユーザー取得エラー:", error);
      return null;
    }
    return data.user;
  } catch (error) {
    console.error("APIルートでの認証エラー:", error);
    return null;
  }
}

/**
 * サービスロールでユーザーを取得
 */
export async function getServiceRoleUser(userId: string): Promise<User | null> {
  try {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) {
      console.error("管理者権限でのユーザー取得エラー:", error);
      return null;
    }
    return data.user;
  } catch (error) {
    console.error("サービスロールでの認証エラー:", error);
    return null;
  }
}

/**
 * パスワードリセットメールを送信
 * @param email - メールアドレス
 */
export async function resetPassword(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function getSession() {
  const supabase = createClient();
}
