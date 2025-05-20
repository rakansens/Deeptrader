import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

/**
 * ユーザー登録
 * @param email - メールアドレス
 * @param password - パスワード
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

/**
 * ログイン処理
 * @param email - メールアドレス
 * @param password - パスワード
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

/**
 * サインアウト
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * 現在のユーザーを取得
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
