"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/utils/supabase";
import type { Conversation } from "@/types/chat";
import { logger } from "@/lib/logger";

export interface UseConversations {
  conversations: Conversation[];
  selectedId: string;
  selectConversation: (id: string) => void;
  newConversation: () => Promise<string>;
  renameConversation: (id: string, title: string) => void;
  removeConversation: (id: string) => void;
}

/**
 * 会話リストの状態を管理するカスタムフック
 * DB専用実装 - LocalStorageは使用しない
 */
export function useConversations(): UseConversations {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [initialized, setInitialized] = useState(false);

  // UUIDかどうかをチェックする関数
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // 初期化時にDBからデータを読み込む
  useEffect(() => {
    const initConversations = async () => {
      if (initialized) return;
      
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        
        if (userId) {
          // DBから会話リストを取得
          const { data: dbConversations, error } = await supabase
            .from("conversations")
            .select("id, title, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
            
          if (!error && dbConversations && dbConversations.length > 0) {
            // DBのデータを設定
            const convs = dbConversations.map(conv => ({
              id: conv.id,
              title: conv.title || "新しい会話"
            }));
            setConversations(convs);
            
            // 最新の会話を選択
            setSelectedId(convs[0].id);
            logger.info(`[useConversations] DBから${convs.length}件の会話を読み込みました`);
          } else if (error) {
            logger.error('[useConversations] DB読み込みエラー:', error);
            // エラー時は新規作成
            await createAndSetInitialConversation();
          } else {
            // DBに会話が無い場合は新規作成
            logger.info('[useConversations] DBに会話が無いため新規作成します');
            await createAndSetInitialConversation();
          }
        } else {
          // ログインしていない場合は空のまま
          logger.warn('[useConversations] ユーザーがログインしていません');
        }
      } catch (error) {
        logger.error("会話データの初期化に失敗:", error);
        // エラー時のフォールバック
        await createAndSetInitialConversation();
      } finally {
        setInitialized(true);
      }
    };

    initConversations();
  }, [initialized]);

  // 初期会話を作成して状態にセットする関数
  const createAndSetInitialConversation = async () => {
    const newId = await createInitialConversation();
    if (newId) {
      const newConv = { id: newId, title: "新しい会話" };
      setConversations([newConv]);
      setSelectedId(newId);
    }
  };

  // 初期会話を作成する関数
  const createInitialConversation = async (): Promise<string | null> => {
    try {
      const id = crypto.randomUUID();
      const supabase = createClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (userId) {
        const { data, error } = await supabase
          .from("conversations")
          .insert({
            id,
            title: "新しい会話",
            user_id: userId,
          })
          .select()
          .single();
          
        if (error) {
          logger.error('初期会話レコード作成エラー:', error);
          return null;
        } else {
          logger.info(`[useConversations] 初期会話を作成しました: ${id}`);
          return id;
        }
      }
      
      return null;
    } catch (err) {
      logger.error('初期会話作成エラー:', err);
      return null;
    }
  };

  const selectConversation = (id: string) => {
    console.log(`🔍 [useConversations] selectConversation呼び出し - id: "${id}"`);
    console.log(`🔍 [useConversations] 現在のselectedId: "${selectedId}"`);
    console.log(`🔍 [useConversations] isValidUUID(${id}):`, isValidUUID(id));
    
    if (isValidUUID(id)) {
      console.log(`🔍 [useConversations] 有効なUUIDのため、selectedIdを "${id}" に変更`);
      setSelectedId(id);
    } else {
      logger.warn(`[useConversations] 無効な会話ID: ${id}`);
      console.log(`🔍 [useConversations] 無効なUUIDのため選択をスキップ: ${id}`);
    }
  };

  const newConversation = async () => {
    try {
      const id = crypto.randomUUID();
      const conv = { id, title: `会話 ${conversations.length + 1}` };
      
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (userId) {
        const { data, error } = await supabase
          .from("conversations")
          .insert({
            id,
            title: conv.title,
            user_id: userId,
          })
          .select()
          .single();
          
        if (error) {
          logger.error('会話レコード作成エラー:', error);
          throw error;
        } else {
          logger.info(`[useConversations] 新しい会話を作成しました: ${id}`);
        }
      }
      
      setConversations((prev) => [...prev, conv]);
      setSelectedId(id);
      
      return id;
    } catch (err) {
      logger.error('新規会話作成エラー:', err);
      throw err;
    }
  };

  const renameConversation = async (id: string, title: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("conversations")
        .update({ title })
        .eq("id", id);
        
      if (error) {
        logger.error('会話名変更エラー:', error);
        throw error;
      }
      
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    } catch (err) {
      logger.error('会話名変更エラー:', err);
    }
  };

  const removeConversation = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);
        
      if (error) {
        logger.error('会話削除エラー:', error);
        throw error;
      }
      
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        // 削除後に選択を更新
        if (selectedId === id && updated.length > 0) {
          setSelectedId(updated[0].id);
        }
        return updated;
      });
    } catch (err) {
      logger.error('会話削除エラー:', err);
    }
  };

  return {
    conversations,
    selectedId,
    selectConversation,
    newConversation,
    renameConversation,
    removeConversation,
  };
}

export default useConversations;
