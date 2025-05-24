"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/utils/supabase";
import type { Conversation } from "@/types/chat";
import { logger } from "@/lib/logger";
import { 
  safeGetJson, 
  safeSetJson, 
  safeGetString, 
  safeSetString, 
  safeRemoveItem 
} from "@/lib/local-storage-utils";

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

  // 初期化時にlocalStorageからデータを読み込む
  useEffect(() => {
    const initConversations = async () => {
      if (initialized) return;
      
      try {
        const stored = safeGetJson<Conversation[]>("conversations", [], "conversations");
        const sel = safeGetString("selectedConversation");
        
        // "current"のような無効なIDを除外
        const validConversations = stored.filter(conv => isValidUUID(conv.id));
        
        // 既存の有効な会話があるかチェック
        if (validConversations.length > 0 && sel && isValidUUID(sel)) {
          setConversations(validConversations);
          setSelectedId(sel);
        } else {
          // 有効な会話が無い場合は新規作成
          logger.info('[useConversations] 有効な会話が無いため新規作成します');
          const newId = await createInitialConversation();
          if (newId) {
            const newConv = { id: newId, title: "新しい会話" };
            setConversations([newConv]);
            setSelectedId(newId);
          }
        }
      } catch (error) {
        logger.error("会話データの読み込みに失敗:", error);
        // エラー時も新規会話を作成
        const newId = await createInitialConversation();
        if (newId) {
          const newConv = { id: newId, title: "新しい会話" };
          setConversations([newConv]);
          setSelectedId(newId);
        }
      } finally {
        setInitialized(true);
      }
    };

    initConversations();
  }, [initialized]);

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
        } else {
          logger.info(`[useConversations] 初期会話を作成しました: ${id}`);
        }
      }
      
      // メッセージ配列を初期化
      safeSetJson(`messages_${id}`, [], `messages for ${id}`);
      return id;
    } catch (err) {
      logger.error('初期会話作成エラー:', err);
      return null;
    }
  };

  // 状態変更時にlocalStorageへ保存
  useEffect(() => {
    if (initialized) {
      console.log(`🔍 [useConversations] conversations保存 - ${conversations.length}件:`, conversations.map(c => ({ id: c.id, title: c.title })));
      safeSetJson("conversations", conversations, "conversations");
    }
  }, [conversations, initialized]);

  useEffect(() => {
    if (initialized && selectedId) {
      console.log(`🔍 [useConversations] selectedId保存: "${selectedId}"`);
      safeSetString("selectedConversation", selectedId);
    }
  }, [selectedId, initialized]);

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
        } else {
          logger.info(`[useConversations] 新しい会話を作成しました: ${id}`);
        }
      }
      
      setConversations((prev) => [...prev, conv]);
      setSelectedId(id);
      
      safeSetJson(`messages_${id}`, [], `messages for ${id}`);
      return id;
    } catch (err) {
      logger.error('新規会話作成エラー:', err);
      return crypto.randomUUID(); // フォールバック
    }
  };

  const renameConversation = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  };

  const removeConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      setSelectedId((s) => (s === id ? updated[0]?.id ?? "" : s));
      return updated;
    });
    
    try {
      safeRemoveItem(`messages_${id}`);
    } catch (error) {
      logger.error("メッセージデータの削除に失敗:", error);
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
