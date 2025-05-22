"use client";

import { getBrowserSupabase } from "@/lib/supabase-browser";

import { useEffect, useState } from "react";
import {
  useChat as useAIChatBase,
  type UseChatHelpers,
  type Message as AIMessage,
} from "ai/react";

type UseAIChatTyped<M> = Omit<UseChatHelpers, 'messages' | 'append' | 'setMessages'> & {
  messages: M[];
  append: (message: M, chatRequestOptions?: unknown) => Promise<string | null | undefined>;
  setMessages: (messages: M[]) => void;
};

import { useConversations } from "./use-conversations";
import { useSidebar } from "./use-sidebar";

function useAIChat<M>(options?: Parameters<typeof useAIChatBase>[0]): UseAIChatTyped<M> {
  return useAIChatBase(options) as unknown as UseAIChatTyped<M>;
}
import type { Conversation, Message } from "@/types/chat";
import { logger } from "@/lib/logger";
import { useChatMessages } from "./use-chat-messages";

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

  const {
    messages: aiMessages,
    input,
    setInput,
    append,
    setMessages: setAiMessages,
    isLoading,
    error: aiError,
  } = useAIChat<Message>({
    api: "/api/chat",
    id: selectedId,
    initialMessages: [] as unknown as AIMessage[],
  });
  
  const { messages, setMessages } = useChatMessages(selectedId, setAiMessages);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (aiError) {
      setError(aiError.message);
    }
  }, [aiError]);

  const { sidebarOpen, toggleSidebar } = useSidebar(false);

  const newConversation = async () => {
    const id = await createConversation();
    setAiMessages([]);
    setMessages([]);
  };


  // Vercel AI SDKのaiMessagesの変更をローカルのmessagesに反映
  useEffect(() => {
    // Mastra から返って来る aiMessages はすでに Message 型
    // timestamp が欠けていた場合のみ補完する
    setMessages(
      aiMessages.map((m) => ({
        ...m,
        timestamp: m.timestamp ?? Date.now(),
        id: m.id ?? crypto.randomUUID(),
      })),
    );
  }, [aiMessages, setMessages]);


  const sendMessage = async (textParam?: string, imageFile?: File) => {
    const text = (textParam ?? input).trim();
    if (!text && !imageFile) return;

    setError(null);
    const userMessageId = crypto.randomUUID();
    
    let uiContent = text;
    let messageType: Message['type'] = 'text';
    let uiImageUrl: string | undefined;
    let promptForDb = text;

    if (imageFile) {
      messageType = 'image';
      promptForDb = text || 'この画像を説明してください。';
      uiContent = promptForDb;

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
      // Supabase v1/v2の違いに対応（publicUrl/publicURL）
      uiImageUrl = (urlData as any)?.publicUrl || (urlData as any)?.publicURL || "";
    }

    const uiMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: imageFile ? uiContent : text,
      type: messageType,
      prompt: imageFile ? promptForDb : undefined,
      imageUrl: uiImageUrl,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, uiMessage]);

    try {
      await append(uiMessage);
      
      if (!imageFile) { 
        setInput("");
      }
    } catch (err) {
        const message =
         err instanceof Error
           ? err.message
           : 'メッセージ送信中にエラーが発生しました';
        setError(message);
        logger.error("AIへのメッセージ送信失敗:", err);
    }
  };

  const sendImageMessage = async (dataUrl: string, promptText = 'このチャートを分析してください') => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      setError('無効な画像データです。');
      logger.error('無効な画像データURL:', dataUrl);
      return;
    }
    setError(null);
    const userMessageId = crypto.randomUUID();

    const uiMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: promptText,
      type: 'image',
      prompt: promptText,
      imageUrl: dataUrl,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, uiMessage]);

    try {
      await append(uiMessage);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : '画像メッセージ送信中にエラーが発生しました';
      setError(message);
      logger.error("AIへの画像メッセージ送信失敗:", err);
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
    sendImageMessage,
  };
}

export default useChat;
