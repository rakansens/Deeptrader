"use client";

import { useEffect, useState } from "react";
import { useChat as useAIChat } from "ai/react";
import { useConversations } from "./use-conversations";
import { useSidebar } from "./use-sidebar";
import type { Conversation, Message } from "@/types";
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
  newConversation: () => void;
  renameConversation: (id: string, title: string) => void;
  removeConversation: (id: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  sendMessage: (text?: string) => Promise<void>;
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

  const [messages, setMessages] = useState<Message[]>([])

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
    initialMessages: messages.map((m) => ({ role: m.role, content: m.content })) as any,
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
      const stored = localStorage.getItem(`messages_${selectedId}`)
      const parsed = stored ? (JSON.parse(stored) as Partial<Message>[]) : []
      const msgs = parsed.map((m) => ({
        id: m.id ?? crypto.randomUUID(),
        role: m.role as Message['role'],
        content: m.content ?? '',
        type: m.type ?? 'text',
        prompt: m.prompt,
        timestamp: m.timestamp ?? Date.now(),
      }))
      setMessages(msgs)
      setAiMessages(msgs.map((m) => ({ role: m.role, content: m.content })) as any)
    } catch {
      setMessages([])
      setAiMessages([])
    }
  }, [selectedId, setAiMessages]);

  // aiMessagesの変更を自メッセージに反映
  useEffect(() => {
    setMessages((prev) =>
      aiMessages.map((m, i) => {
        // contentの処理を改善
        let messageContent = (m as any).content;
        
        // 配列の場合（マルチモーダルメッセージ）
        if (Array.isArray(messageContent)) {
          // テキスト部分を抽出
          const textItem = messageContent.find((item: any) => item.type === 'text');
          messageContent = textItem ? textItem.text : JSON.stringify(messageContent);
        } 
        // オブジェクトの場合
        else if (typeof messageContent === 'object' && messageContent !== null) {
          if (messageContent.text) {
            messageContent = messageContent.text;
          } else {
            // 安全のためオブジェクトを文字列化
            try {
              messageContent = JSON.stringify(messageContent);
            } catch {
              messageContent = '[複雑なメッセージ]';
            }
          }
        }
        
        // type属性を取得（画像メッセージかどうかの判別に使用）
        const msgType = (m as any).type || prev[i]?.type || 'text';
        
        // promptプロパティを保持
        const msgPrompt = (m as any).prompt || prev[i]?.prompt;
        
        // 画像タイプの場合は、元のコンテンツを保持
        if (msgType === 'image' && prev[i]?.content && typeof prev[i]?.content === 'string' && prev[i]?.content.startsWith('data:image/')) {
          messageContent = prev[i].content;
        }
        
        return {
        id: prev[i]?.id ?? (m as any).id ?? crypto.randomUUID(),
        role: m.role as Message['role'],
          content: messageContent,
          type: msgType,
          prompt: msgPrompt,
        timestamp: prev[i]?.timestamp ?? Date.now(),
        };
      })
    )
  }, [aiMessages]);

  // メッセージをlocalStorageへ保存
  useEffect(() => {
    try {
      localStorage.setItem(`messages_${selectedId}`, JSON.stringify(messages));
    } catch {
      // ignore write errors
    }
  }, [messages, selectedId]);

  const sendMessage = async (textParam?: string) => {
    const text = (textParam ?? input).trim();
    if (!text) return;
    
    setError(null);
    try {
      // Chat.tsx側で既に入力欄をクリアしているので、ここでは何もしない
      await append({
        role: "user",
        content: text,
        type: "text",
      } as any);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "メッセージ送信中にエラーが発生しました";
      setError(message);
    }
  };

  const sendImageMessage = async (dataUrl: string, prompt = 'このチャートを分析してください') => {
    if (!dataUrl) return;
    setError(null);
    
    try {
      logger.debug('画像メッセージを送信します');
      
      // 画像が正しいデータURLかチェック
      if (!dataUrl.startsWith('data:image/')) {
        throw new Error('無効な画像データです');
      }
      
      // まずローカルUI用のメッセージを追加
      const imageMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: dataUrl,
        type: 'image',
        prompt,
        timestamp: Date.now(),
      };
      
      // UIに即時反映
      setMessages((prev) => [...prev, imageMsg]);
      
      // APIに送信するフォーマット（OpenAIのマルチモーダルメッセージ形式）
      await append({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
        type: 'image',
        prompt,
      } as any);
      
      logger.debug('画像メッセージ送信完了');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'メッセージ送信中にエラーが発生しました';
      logger.error('画像メッセージ送信エラー:', errorMsg);
      setError(errorMsg);
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
