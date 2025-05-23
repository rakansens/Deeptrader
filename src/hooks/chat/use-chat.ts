// src/hooks/chat/use-chat.ts
// チャット管理フック - AI SDK削除でmessage:undefinedエラーを修正
// 直接チャットAPIにfetchでメッセージ送信するカスタム実装

"use client";

import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useEffect, useState, useCallback } from "react";
import { useConversations } from "./use-conversations";
import { useSidebar } from "./use-sidebar";
import type { Conversation, Message } from "@/types/chat";
import { logger } from "@/lib/logger";

export interface UseChat {
  messages: Message[];
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  error: string | null;
  conversations: Conversation[];
  selectedId: string;
  selectConversation: (id: string) => void;
  newConversation: () => Promise<void>;
  renameConversation: (id: string, title: string) => void;
  removeConversation: (id: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  sendMessage: (text?: string, imageFile?: File) => Promise<void>;
  sendImageMessage: (dataUrl: string, prompt?: string) => Promise<void>;
}

/**
 * チャットの状態と操作を管理するカスタムフック
 * AI SDKを使わずに直接チャットAPIと通信する実装
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

  const { sidebarOpen, toggleSidebar } = useSidebar(false);

  // 会話変更時のメッセージリセット
  useEffect(() => {
    // TODO: 会話切り替え時のメッセージクリア実装
    setMessages([]);
  }, [selectedId]);

  const newConversation = async () => {
    const id = await createConversation();
    setMessages([]);
  };

  // カスタムsendMessage実装（画像対応など）
  const sendMessage = useCallback(async (textParam?: string, imageFile?: File) => {
    const text = (textParam ?? input).trim();
    if (!text && !imageFile) return;

    setError(null);
    setLoading(true);

    // ユーザーメッセージを即座に追加
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
      type: "text",
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      let imageUrl = "";
      
      if (imageFile) {
        // 画像アップロード処理
        const ext = imageFile.name.split('.').pop() || 'png';
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const supabase = getBrowserSupabase();
        const { error: upErr } = await supabase.storage
          .from('chat-images')
          .upload(fileName, imageFile);

        if (upErr) {
          logger.error("画像アップロード失敗:", upErr);
          setError("画像のアップロードに失敗しました。");
          return;
        }
        
        const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(fileName);
        imageUrl = (urlData as any)?.publicUrl || (urlData as any)?.publicURL || "";
      }

      // チャットAPIに送信
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: imageFile ? `${text}\n\n[画像: ${imageUrl}]` : text,
          symbol: "BTCUSDT", // デフォルト値
          timeframe: "1h", // デフォルト値
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // アシスタントメッセージを追加
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || "応答を受信できませんでした",
        timestamp: Date.now(),
        type: "text",
      };
      setMessages(prev => [...prev, assistantMessage]);

      // 入力をクリア
      if (!imageFile) {
        setInput("");
      }

    } catch (err) {
      logger.error("メッセージ送信エラー:", err);
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました";
      setError(errorMessage);
      
      // エラーメッセージを追加
      const errorMessageObj: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `❌ エラー: ${errorMessage}`,
        timestamp: Date.now(),
        type: "text",
      };
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
    }
  }, [input]);

  const sendImageMessage = useCallback(async (dataUrl: string, promptText = 'このチャートを分析してください') => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      setError('無効な画像データです。');
      return;
    }

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'chart.png', { type: 'image/png' });
      
      await sendMessage(promptText, file);
    } catch (err) {
      const message = err instanceof Error ? err.message : '画像メッセージ送信中にエラーが発生しました';
      setError(message);
      logger.error("AIへの画像メッセージ送信失敗:", err);
    }
  }, [sendMessage]);

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
    sendImageMessage,
  };
}

export default useChat; 