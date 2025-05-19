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
    conversations,
    selectedId,
    selectConversation,
    newConversation: createConversation,
    renameConversation,
    removeConversation,
  } = useConversations();

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem(`messages_${selectedId}`);
      if (stored) {
        return JSON.parse(stored) as Message[];
      }
    } catch {
      // ignore parse errors
    }
    return [];
  });

  const {
    messages: aiMessages,
    input,
    setInput,
    append,
    setMessages: setAiMessages,
    isLoading,
    error: aiError,
  } = useAIChat({
    api: "/api/chat",
    id: selectedId,
    initialMessages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (aiError) {
      setError(aiError.message);
    }
  }, [aiError]);

  const { sidebarOpen, toggleSidebar } = useSidebar(true);

  const newConversation = () => {
    const id = createConversation();
    setAiMessages([]);
    setMessages([]);
    try {
      localStorage.setItem(`messages_${id}`, JSON.stringify([]));
    } catch {
      // ignore write errors
    }
  };

  // 選択中の会話が変わったら保存済みメッセージを読み込む
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`messages_${selectedId}`);
      const parsed = stored ? (JSON.parse(stored) as Message[]) : [];
      setMessages(parsed);
      setAiMessages(parsed.map((m) => ({ role: m.role, content: m.content })));
    } catch {
      setMessages([]);
      setAiMessages([]);
    }
  }, [selectedId, setAiMessages]);

  // aiMessagesの変更を自メッセージに反映
  useEffect(() => {
    setMessages((prev) =>
      aiMessages.map((m, i) => ({
        role: m.role as Message["role"],
        content: m.content,
        timestamp: prev[i]?.timestamp ?? Date.now(),
      }))
    );
  }, [aiMessages]);

  // メッセージをlocalStorageへ保存
  useEffect(() => {
    try {
      localStorage.setItem(`messages_${selectedId}`, JSON.stringify(messages));
    } catch {
      // ignore write errors
    }
  }, [messages, selectedId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    
    setError(null);
    try {
      await append({ 
        role: "user", 
        content: text,
      });
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
