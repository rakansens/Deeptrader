import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchMessages, addMessage } from '@/infrastructure/supabase/db-service';
import type { Message } from '@/types/chat';
import { logger } from '@/lib/logger';
import { safeGetJson, safeSetJson } from "@/lib/local-storage-utils";

/**
 * ローカルストレージとSupabaseへのメッセージ同期を行うフック
 */
export function useChatMessages(
  selectedId: string,
  setAiMessages: (messages: Message[]) => void
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const lastSynced = useRef(0);

  // 選択された会話のメッセージを読み込む
  useEffect(() => {
    if (selectedId) {
      const stored = safeGetJson<Message[]>(`messages_${selectedId}`, [], `messages for ${selectedId}`);
      setMessages(stored);
    } else {
      setMessages([]);
    }
  }, [selectedId]);

  // 選択中の会話が変わったら保存済みメッセージを読み込む
  useEffect(() => {
    try {
      const stored = safeGetJson<Partial<Message>[]>(`messages_${selectedId}`, [], `messages for ${selectedId}`);
      if (stored.length > 0) {
        const msgs = stored.map((m) => ({
          id: m.id ?? crypto.randomUUID(),
          role: m.role as Message['role'],
          content: m.content ?? '',
          type: m.type ?? 'text',
          prompt: m.prompt,
          imageUrl: m.imageUrl,
          timestamp: m.timestamp ?? Date.now(),
        }));
        setMessages(msgs);
        setAiMessages(msgs);
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
            role: m.role as Message['role'],
            content: m.content,
            type: m.type as 'text' | 'image',
            prompt: m.prompt || undefined,
            imageUrl: m.image_url || undefined,
            timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
          }));
          setMessages(msgs);
          setAiMessages(msgs);
          lastSynced.current = msgs.length;
        }
      })
      .catch((err) => {
        logger.error('Supabaseからの取得に失敗', err);
      });
  }, [selectedId, setAiMessages]);

  // メッセージ更新時に永続化
  useEffect(() => {
    safeSetJson(`messages_${selectedId}`, messages, `messages for ${selectedId}`);

    messages.forEach((m, idx) => {
      if (idx >= lastSynced.current) {
        addMessage(selectedId, m.role, m.content, m.type, m.prompt, m.imageUrl)
          .catch((err) => logger.error('DBへのメッセージ追加に失敗:', err));
      }
    });
    lastSynced.current = messages.length;
  }, [messages, selectedId]);

  // メッセージ配列をlocalStorageに保存
  const saveMessages = useCallback((msgs: Message[]) => {
    if (selectedId) {
      safeSetJson(`messages_${selectedId}`, msgs, `messages for ${selectedId}`);
    }
  }, [selectedId]);

  return { messages, setMessages } as const;
}