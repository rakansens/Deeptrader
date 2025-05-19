"use client";

import { useEffect, useState } from "react";
import { useChat as useAIChat } from "ai/react";
import { useConversations } from "./use-conversations";
import { useSidebar } from "./use-sidebar";
import type { Conversation, Message } from "@/types/chat";

export interface UseChat {
  messages: Message[];
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  error: string | null;
  conversations: Conversation[];
  selectedId: string;
  selectConversation: (id: string) => void;
  newConversation: () => void;
  renameConversation: (id: string, title: string) => void;
  removeConversation: (id: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  sendMessage: () => Promise<void>;
}

/**
 * チャットの状態と操作を管理するカスタムフック
 */
export function useChat(): UseChat {
  const {
    messages: aiMessages,
    input,
    setInput,
    append,
    setMessages: setAiMessages,
    isLoading,
    error: aiError,
  } = useAIChat({ api: "/api/chat" });

  const messages: Message[] = aiMessages.map((m) => ({
    role: m.role as Message["role"],
    content: m.content,
  }));

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (aiError) {
      setError(aiError.message);
    }
  }, [aiError]);

  const {
    conversations,
    selectedId,
    selectConversation,
    newConversation: createConversation,
    renameConversation,
    removeConversation,
  } = useConversations();

  const { sidebarOpen, toggleSidebar } = useSidebar(true);

  const newConversation = () => {
    createConversation();
    setAiMessages([]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    
    setError(null);
    try {
      await append({ role: "user", content: text });
      setInput(""); // 非同期処理の完了後に入力をクリア
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "メッセージ送信中にエラーが発生しました";
      setError(message);
    }
  };

  return {
    messages,
    input,
    setInput,
    loading: isLoading,
    error,
    conversations,
    selectedId,
    selectConversation,
    newConversation,
    renameConversation,
    removeConversation,
    sidebarOpen,
    toggleSidebar,
    sendMessage,
  };
}

export default useChat;
