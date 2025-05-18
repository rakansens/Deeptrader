"use client";

import { useState } from "react";
import { useConversations } from "./use-conversations";
import { useSidebar } from "./use-sidebar";
import type { Conversation } from "@/components/chat/conversation-sidebar";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setMessages([]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        let errorMessage = "";
        try {
          const data = await res.json();
          errorMessage = data.error || `APIエラー: ${res.status}`;
        } catch (e) {
          errorMessage = `APIエラー: ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        throw new Error("APIからの応答が無効です");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "メッセージ送信中にエラーが発生しました";
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `すみません、エラーが発生しました: ${errorMessage}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    loading,
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
