"use client";

import { useEffect, useState, useRef } from "react";
import { useChat as useAIChat } from "ai/react";
import { useConversations } from "./use-conversations";
import { useSidebar } from "./use-sidebar";
import type { Conversation, Message } from "@/types";
import { logger } from "@/lib/logger";
import {
  addMessage,
  fetchMessages,
} from "@/infrastructure/supabase/db-service";
import { supabase } from "@/lib/supabase";

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

  const [messages, setMessages] = useState<Message[]>([]);
  const lastSynced = useRef(0);

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
    initialMessages: messages.map((m) => ({
      role: m.role,
      content: (m.type === 'image' && m.imageUrl && m.prompt)
                ? [ {type: 'text', text: m.prompt}, {type: 'image_url', image_url: { url: m.imageUrl }} ]
                : m.content,
    })) as any,
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
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Message>[];
        const msgs = parsed.map((m) => ({
          id: m.id ?? crypto.randomUUID(),
          role: m.role as Message["role"],
          content: m.content ?? "",
          type: m.type ?? 'text',
          prompt: m.prompt,
          imageUrl: m.imageUrl,
          timestamp: m.timestamp ?? Date.now(),
        }));
        setMessages(msgs);
        setAiMessages(
          msgs.map((m) => ({
            role: m.role,
            content: (m.type === 'image' && m.imageUrl && m.prompt)
                      ? [ {type: 'text', text: m.prompt}, {type: 'image_url', image_url: { url: m.imageUrl }} ]
                      : m.content,
          })) as any,
        );
        lastSynced.current = msgs.length;
      }
    } catch (err) {
      logger.error('ローカルストレージからの読み込みに失敗', err);
    }

    fetchMessages(selectedId)
      .then((data) => {
        if (data && data.length > 0) {
          logger.debug('Supabaseからメッセージを取得しました', data.length);
          const msgs = data.map((m) => ({
            id: String(m.id),
            role: m.sender as Message["role"],
            content: m.content,
            type: m.type ?? 'text',
            prompt: m.prompt,
            imageUrl: m.image_url,
            timestamp: new Date(m.created_at).getTime(),
          }));
          setMessages(msgs);
          setAiMessages(
            msgs.map((m) => ({
              role: m.role,
              content: (m.type === 'image' && m.imageUrl && m.prompt)
                        ? [ {type: 'text', text: m.prompt}, {type: 'image_url', image_url: { url: m.imageUrl }} ]
                        : m.content,
            })) as any,
          );
          lastSynced.current = msgs.length;
        }
      })
      .catch((err) => {
        logger.error('Supabaseからの取得に失敗', err);
      });
  }, [selectedId, setAiMessages]);

  // Vercel AI SDKのaiMessagesの変更をローカルのmessagesに反映
  useEffect(() => {
    if (!isLoading && aiMessages.length > messages.length) {
      const newFormattedMessages = aiMessages.map((aiMsg, index) => {
        const prevMsg = messages[index];
        let content = aiMsg.content;
        let type: Message['type'] = 'text';
        let prompt: string | undefined = undefined;
        let imageUrl: string | undefined = undefined;

        if (Array.isArray(aiMsg.content)) {
          const textItem = aiMsg.content.find(item => item.type === 'text');
          const imageItem = aiMsg.content.find(item => item.type === 'image_url');
          content = textItem?.text || '';
          if (imageItem) {
            type = 'image';
            imageUrl = imageItem.image_url.url;
            prompt = content;
          }
        } else if (typeof aiMsg.content === 'object' && aiMsg.content !== null) {
          try {
            content = JSON.stringify(aiMsg.content);
          } catch {
            content = '[複雑なメッセージ形式]';
          }
        }

        return {
          id: prevMsg?.id ?? (aiMsg as any).id ?? crypto.randomUUID(),
          role: aiMsg.role as Message['role'],
          content: content as string,
          type: prevMsg?.type ?? type,
          prompt: prevMsg?.prompt ?? prompt,
          imageUrl: prevMsg?.imageUrl ?? imageUrl,
          timestamp: prevMsg?.timestamp ?? Date.now(),
        };
      });
      setMessages(newFormattedMessages);
    }
  }, [aiMessages, isLoading, messages]);

  // ローカルのmessagesをlocalStorageとSupabaseに保存
  useEffect(() => {
    try {
      localStorage.setItem(`messages_${selectedId}`, JSON.stringify(messages));
    } catch {
      // ignore write errors
    }
    
    messages.forEach((m, idx) => {
      if (idx >= lastSynced.current) {
        addMessage(selectedId, m.role, m.content, m.type, m.prompt, m.imageUrl)
          .then(() => {
            if (idx === messages.length - 1) {
              lastSynced.current = messages.length;
            }
          })
          .catch((err) => logger.error("DBへのメッセージ追加に失敗:", err));
      }
    });
  }, [messages, selectedId]);

  const sendMessage = async (textParam?: string, imageFile?: File) => {
    const text = textParam ?? input;
    if (!text.trim() && !imageFile) return;

    const userMessageId = crypto.randomUUID();
    let messageContentForAppend: any = text;
    let uiContent = text;
    let messageType: Message['type'] = 'text';
    let imageUrlForDb: string | undefined;

    if (imageFile) {
      messageType = 'image';
      const reader = new FileReader();
      const dataUrlPromise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(imageFile);
      const dataUrl = await dataUrlPromise;
      imageUrlForDb = dataUrl;
      uiContent = text || 'この画像を説明してください。';
      messageContentForAppend = [
        { type: 'text', text: uiContent },
        { type: 'image_url', image_url: { url: dataUrl } },
      ];
    }

    const messageToAppend = {
      id: userMessageId,
      role: 'user' as const,
      content: messageContentForAppend,
    };

    const uiMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: uiContent,
      type: messageType,
      prompt: text || (imageFile ? 'この画像を説明してください。' : undefined),
      imageUrl: imageUrlForDb,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, uiMessage]);
    
    try {
      await addMessage(selectedId, 'user', uiContent, messageType, uiMessage.prompt, imageUrlForDb);
      lastSynced.current = messages.length + 1;
    } catch (err) {
      logger.error("DBへのメッセージ保存に失敗:", err);
    }

    await append(messageToAppend);

    if (!imageFile) {
      setInput("");
    }
  };

  const sendImageMessage = async (dataUrl: string, promptText = 'このチャートを分析してください') => {
    const userMessageId = crypto.randomUUID();

    const messageToAppend = {
      id: userMessageId,
      role: 'user' as const,
      content: [
        { type: 'text', text: promptText },
        { type: 'image_url', image_url: { url: dataUrl } },
      ],
    };

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
      await addMessage(selectedId, 'user', promptText, 'image', promptText, dataUrl);
      lastSynced.current = messages.length + 1;
    } catch (err) {
      logger.error("DBへの画像メッセージ保存に失敗:", err);
    }

    await append(messageToAppend);
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
