"use client";

import { useState } from "react";
import type { Conversation } from "@/components/chat/conversation-sidebar";

export interface UseConversations {
  conversations: Conversation[];
  selectedId: string;
  selectConversation: (id: string) => void;
  newConversation: () => string;
}

/**
 * 会話リストの状態を管理するカスタムフック
 */
export function useConversations(): UseConversations {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "current", title: "現在の会話" },
  ]);
  const [selectedId, setSelectedId] = useState("current");

  const selectConversation = (id: string) => {
    setSelectedId(id);
  };

  const newConversation = () => {
    const id = Date.now().toString();
    const conv = { id, title: `会話 ${conversations.length + 1}` };
    setConversations((prev) => [...prev, conv]);
    setSelectedId(id);
    return id;
  };

  return { conversations, selectedId, selectConversation, newConversation };
}

export default useConversations;
