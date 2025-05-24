import { createClient } from "@/utils/supabase";

import type { Database } from "@/types";
import { logger } from "@/lib/logger";

// ゲストユーザー用のデフォルトID
const GUEST_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * 会話を作成
 */
export async function createConversation(userId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * 会話一覧を取得
 */
export async function fetchConversations(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * メッセージを追加
 */
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  type: "text" | "image" = "text",
  prompt?: string,
  imageUrl?: string,
): Promise<string> {
  try {
    const supabase = createClient();
    // ユーザーIDを取得
    const { data: authData } = await supabase.auth.getUser();
    // ユーザーIDがない場合はゲストIDを使用
    const userId = authData?.user?.id || GUEST_USER_ID;

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
        type,
        prompt,
        image_url: imageUrl,
      })
      .select("id,created_at")
      .single();

    if (error) {
      // テーブルが存在しない場合は静かに失敗
      if (error.code === '42P01') { // relation does not exist
        logger.warn('chat_messages テーブルが存在しません。メッセージは保存されません。');
        return '';
      }
      throw error;
    }
    
    return data.id;
  } catch (err) {
    logger.error('メッセージ追加エラー:', err);
    throw err; // エラーを上位に伝播させる
  }
}

/**
 * メッセージ一覧を取得
 */
export async function fetchMessages(conversationId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (error) {
      // テーブルが存在しない場合は空の配列を返す
      if (error.code === '42P01') { // relation does not exist
        logger.warn('chat_messages テーブルが存在しません。空の配列を返します。');
        return [];
      }
      throw error;
    }
    
    return data;
  } catch (err) {
    logger.error('メッセージ取得エラー:', err);
    return []; // エラー時は空配列を返す
  }
}

export type TradingHistoryInsert =
  Database["public"]["Tables"]["trading_history"]["Insert"];

/**
 * 取引履歴を追加
 */
export async function insertTradingHistory(data: TradingHistoryInsert) {
  const supabase = createClient();
  const { error } = await supabase.from("trading_history").insert(data);
  if (error) throw error;
}
