"use client";

import { getBrowserSupabase } from "@/lib/supabase-browser";

import { useEffect, useState } from "react";
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
 */
export function useConversations(): UseConversations {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "current", title: "現在の会話" },
  ]);
  const [selectedId, setSelectedId] = useState("current");

  // 初期化時にlocalStorageからデータを読み込む
  useEffect(() => {
    try {
      const stored = localStorage.getItem("conversations");
      const sel = localStorage.getItem("selectedConversation");
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        if (parsed.length) {
          setConversations(parsed);
        }
      }
      if (sel) {
        setSelectedId(sel);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // 状態変更時にlocalStorageへ保存
  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem("selectedConversation", selectedId);
  }, [selectedId]);

  const selectConversation = (id: string) => {
    setSelectedId(id);
  };

  const newConversation = async () => {
    try {
      // UUIDを生成
      const id = crypto.randomUUID();
      const conv = { id, title: `会話 ${conversations.length + 1}` };
      
      // Supabaseに会話レコードを作成 (v2 API用に修正)
      const supabase = getBrowserSupabase();
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (sessionErr) {
        console.error("❌ セッション取得失敗:", sessionErr.message);
      }
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
        }
      }
      
      // ローカルステートを更新
      setConversations((prev) => [...prev, conv]);
      setSelectedId(id);
      
      // 新しい会話用のメッセージ配列を初期化
      try {
        localStorage.setItem(`messages_${id}`, JSON.stringify([]));
      } catch {
        // ignore write errors
      }
      return id;
    } catch (err) {
      logger.error('新規会話作成エラー:', err);
      return Date.now().toString(); // フォールバック: エラー時は旧方式のIDを返す
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
    // 対応するメッセージをlocalStorageから削除
    try {
      localStorage.removeItem(`messages_${id}`);
    } catch {
      // ignore remove errors
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
