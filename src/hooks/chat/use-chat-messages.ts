import { useEffect, useRef, useState } from 'react';
import { fetchMessages, addMessage } from '@/infrastructure/supabase/db-service';
import type { Message, OpenAIChatMessage } from '@/types/chat';
import { logger } from '@/lib/logger';

/**
 * ローカルストレージとSupabaseへのメッセージ同期を行うフック
 */
export function useChatMessages(
  selectedId: string,
  setAiMessages: (messages: OpenAIChatMessage[]) => void
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const lastSynced = useRef(0);

  // 選択中の会話が変わったら保存済みメッセージを読み込む
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`messages_${selectedId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Message>[];
        const msgs = parsed.map((m) => ({
          id: m.id ?? crypto.randomUUID(),
          role: m.role as Message['role'],
          content: m.content ?? '',
          type: m.type ?? 'text',
          prompt: m.prompt,
          imageUrl: m.imageUrl,
          timestamp: m.timestamp ?? Date.now(),
        }));
        setMessages(msgs);
        setAiMessages(
          msgs.map(
            (m): OpenAIChatMessage => ({ role: m.role, content: m.content })
          ) as unknown as OpenAIChatMessage[]
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
            role: m.sender as Message['role'],
            content: m.content,
            type: m.type ?? 'text',
            prompt: m.prompt,
            imageUrl: m.image_url,
            timestamp: new Date(m.created_at).getTime(),
          }));
          setMessages(msgs);
          setAiMessages(
            msgs.map(
              (m): OpenAIChatMessage => ({ role: m.role, content: m.content })
            ) as unknown as OpenAIChatMessage[]
          );
          lastSynced.current = msgs.length;
        }
      })
      .catch((err) => {
        logger.error('Supabaseからの取得に失敗', err);
      });
  }, [selectedId, setAiMessages]);

  // メッセージ更新時に永続化
  useEffect(() => {
    try {
      localStorage.setItem(`messages_${selectedId}`, JSON.stringify(messages));
    } catch {
      // ignore write errors
    }

    messages.forEach((m, idx) => {
      if (idx >= lastSynced.current) {
        addMessage(selectedId, m.role, m.content, m.type, m.prompt, m.imageUrl)
          .catch((err) => logger.error('DBへのメッセージ追加に失敗:', err));
      }
    });
    lastSynced.current = messages.length;
  }, [messages, selectedId]);

  return { messages, setMessages } as const;
}