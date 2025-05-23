"use client";

import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useEffect, useState, useCallback } from "react";
import { useChat as useAIChat } from "ai/react";
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
 * AI SDKとMastraを組み合わせた真のストリーミング実装
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

  // AI SDKのuseChatフックを使用
  const {
    messages: aiMessages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error: aiError,
    append,
  } = useAIChat({
    api: "/api/chat",
    onError: (error) => {
      logger.error("AI SDKチャットエラー:", error);
    },
  });

  const [error, setError] = useState<string | null>(null);
  const { sidebarOpen, toggleSidebar } = useSidebar(false);

  // AI SDKのメッセージをアプリケーション形式に変換
  const messages: Message[] = aiMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    timestamp: Date.now(), // AI SDKでは実際のタイムスタンプが無いため現在時刻を使用
    type: "text",
  }));

  // 会話変更時のメッセージリセット
  useEffect(() => {
    // TODO: 会話切り替え時のメッセージクリア実装
    // AI SDKのuseChatではsetMessagesが提供されていないため、
    // 会話履歴の管理は別途実装が必要
  }, [selectedId]);

  const newConversation = async () => {
    const id = await createConversation();
    // TODO: AI SDKのメッセージをクリアする方法を実装
  };

  // カスタムsendMessage実装（画像対応など）
  const sendMessage = useCallback(async (textParam?: string, imageFile?: File) => {
    const text = (textParam ?? input).trim();
    if (!text && !imageFile) return;

    setError(null);

    try {
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
        const imageUrl = (urlData as any)?.publicUrl || (urlData as any)?.publicURL || "";
        
        // 画像メッセージとして送信
        const promptForAI = text || 'この画像を説明してください。';
        await append({
          role: "user",
          content: `${promptForAI}\n\n[画像: ${imageUrl}]`,
        });
      } else {
        // テキストメッセージの場合はAI SDKの標準機能を使用
        await append({
          role: "user",
          content: text,
        });
      }

      // 入力をクリア
      if (!imageFile) {
        setInput("");
      }

    } catch (err) {
      logger.error("メッセージ送信エラー:", err);
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました";
      setError(errorMessage);
    }
  }, [input, append, setInput]);

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
    loading: isLoading,
    error: error || aiError?.message || null,
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