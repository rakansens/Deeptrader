"use client";

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
import type { Conversation, Message, OpenAIChatMessage, OpenAIContent } from "@/types/chat";
import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
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

  const {
    messages: aiMessages,
    input,
    setInput,
    append,
    setMessages: setAiMessages,
    isLoading,
    error: aiError,
  } = useAIChat<OpenAIChatMessage>({
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

  const newConversation = () => {
    const id = createConversation();
    setAiMessages([]);
    setMessages([]);
  };


  // Vercel AI SDKのaiMessagesの変更をローカルのmessagesに反映
  useEffect(() => {
    setMessages((prev) =>
      aiMessages.map((m, i) => {
        type ExtMessage = OpenAIChatMessage & Partial<Omit<Message, 'id' | 'role' | 'content'>> & { id?: string };
        const em = m as ExtMessage;

        let messageContentStr: string = "";
        let messageType: Message['type'] = 'text';
        let messagePrompt: string | undefined = undefined;
        let messageImageUrl: string | undefined = undefined;

        // メッセージコンテンツの処理
        if (typeof em.content === 'string') {
          messageContentStr = em.content;
        } else if (Array.isArray(em.content)) { 
          const textItem = em.content.find((item): item is Extract<OpenAIContent, {type: 'text'}> => item.type === 'text');
          const imageItem = em.content.find((item): item is Extract<OpenAIContent, {type: 'image_url'}> => item.type === 'image_url');

          // テキストコンテンツの取得
          messageContentStr = textItem?.text || "";

          // 画像コンテンツの処理
          if (imageItem) {
            messageType = 'image';
            messageImageUrl = imageItem.image_url.url;
            messagePrompt = textItem?.text;
          }
        } else if (typeof em.content === 'object' && em.content !== null) {
          try {
            messageContentStr = JSON.stringify(em.content);
          } catch {
            messageContentStr = '[複雑なメッセージ形式]';
          }
        }
        
        // 追加属性の処理
        if (em.type === 'image') messageType = 'image';
        if (em.prompt) messagePrompt = em.prompt;
        if (em.imageUrl) messageImageUrl = em.imageUrl;

        // 既存のメッセージ情報を保持
        const prevMsg = prev[i];
        const id = (m as AIMessage).id ?? prevMsg?.id ?? crypto.randomUUID();

        // 画像メッセージの場合、以前のコンテンツを保持
        if (messageType === 'image' && prevMsg?.type === 'image' && prevMsg?.content.startsWith('data:image/')) {
          messageContentStr = prevMsg.content;
        }

        // チャート分析テキストが途切れないようにする処理
        // 1. 前のメッセージが同じIDを持ち、現在のメッセージより短い場合は前のメッセージを使用
        if (prevMsg?.id === id && 
            typeof prevMsg?.content === 'string' && 
            typeof messageContentStr === 'string' &&
            messageContentStr.length < prevMsg.content.length) {
          messageContentStr = prevMsg.content;
        }

        // 2. AIのレスポンスが途中で切れている可能性がある場合は結合
        if (m.role === 'assistant' && prevMsg?.role === 'assistant' && 
            typeof messageContentStr === 'string' && 
            typeof prevMsg?.content === 'string' &&
            !messageContentStr.endsWith('.') && 
            !messageContentStr.endsWith('。')) {
          // 明らかに途中で切れている場合は結合して保持
          if (prevMsg.content.startsWith(messageContentStr) && 
              prevMsg.content.length > messageContentStr.length) {
            messageContentStr = prevMsg.content;
          }
        }

        return {
          id: id,
          role: m.role as Message['role'],
          content: messageContentStr,
          type: prevMsg?.type ?? messageType,
          prompt: prevMsg?.prompt ?? messagePrompt,
          imageUrl: prevMsg?.imageUrl ?? messageImageUrl,
          timestamp: prevMsg?.timestamp ?? Date.now(),
        };
      })
    );
  }, [aiMessages, setMessages]);


  const sendMessage = async (textParam?: string, imageFile?: File) => {
    const text = (textParam ?? input).trim();
    if (!text && !imageFile) return;

    setError(null);
    const userMessageId = crypto.randomUUID();
    
    let contentForAppend: string | OpenAIContent[];
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
      const { error: upErr } = await supabase.storage
        .from('chat-images')
        .upload(fileName, imageFile);

      if (upErr) {
        logger.error("画像アップロード失敗:", upErr);
        setError("画像のアップロードに失敗しました。");
        return;
      }
      
      const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(fileName);
      uiImageUrl = urlData.publicUrl;

      contentForAppend = [
        { type: 'text', text: promptForDb },
        { type: 'image_url', image_url: { url: uiImageUrl } },
      ];

    } else {
      contentForAppend = text;
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
      await append({
        role: 'user',
        content: contentForAppend,
      } as OpenAIChatMessage); 
      
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

    const contentForAppend: OpenAIContent[] = [
      { type: 'text', text: promptText },
      { type: 'image_url', image_url: { url: dataUrl } },
    ];

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
      await append({
        role: 'user',
        content: contentForAppend,
        type: 'image',
        prompt: promptText,
        imageUrl: dataUrl,
      } as OpenAIChatMessage);
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
