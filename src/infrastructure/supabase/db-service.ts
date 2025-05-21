import { supabase } from "@/lib/supabase";
import type { Database } from "@/types";
import { logger } from "@/lib/logger";

/**
 * 会話を作成
 */
export async function createConversation(userId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * 会話一覧を取得
 */
export async function fetchConversations(userId: string) {
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
  sender: string,
  content: string,
  type: string = 'text',
  prompt?: string,
  imageUrl?: string,
) {
  try {
    const { error } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        sender,
        content,
        type,
        prompt,
        image_url: imageUrl,
      });

    if (error) {
      // テーブルが存在しない場合は静かに失敗
      if (error.code === '42P01') { // relation does not exist
        logger.warn('chat_messages テーブルが存在しません。メッセージは保存されません。');
        return;
      }
      throw error;
    }
  } catch (err) {
    logger.error('メッセージ追加エラー:', err);
    // エラーを上位に伝播させない
  }
}

/**
 * メッセージ一覧を取得
 */
export async function fetchMessages(conversationId: string) {
  try {
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
  const { error } = await supabase.from("trading_history").insert(data);
  if (error) throw error;
}
