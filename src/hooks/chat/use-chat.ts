// src/hooks/chat/use-chat.ts
// チャット管理フック - SRP準拠のクリーンアーキテクチャ
// ビジネスロジック層として、メッセージ送信・API通信・状態管理を担当
// UI層(Chat.tsx)との責任分離により、保守性とテスタビリティを向上
// Phase 6A-4: エラーハンドリング統合

"use client";

import { createClient } from "@/utils/supabase";
import { useEffect, useState, useCallback } from "react";
import { useConversations } from "./use-conversations";
import { useSidebar } from "./use-sidebar";
import { addMessage, createConversation as createConversationDB, fetchMessages } from "@/infrastructure/supabase/db-service";
import type { Conversation, Message } from "@/types/chat";
import { logger } from "@/lib/logger";
import { CHAT_API_ENDPOINT } from "@/constants/network";
import { getErrorMessage } from "@/lib/error-utils";
import { isNonEmptyArray, isEmptyArray, hasText, isValidInput } from '@/lib/validation-utils';

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
  sendMessage: (text: string, imageFile?: File) => Promise<void>;
  sendImageMessage: (dataUrl: string, prompt?: string) => Promise<void>;
  // 送信履歴機能
  navigateHistory: (direction: 'up' | 'down') => void;
  resetHistoryNavigation: () => void;
  messageHistory: string[];
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
  
  // 送信履歴機能
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [originalInput, setOriginalInput] = useState("");

  const {
    conversations,
    selectedId,
    selectConversation,
    newConversation: createConversation,
    renameConversation,
    removeConversation,
  } = useConversations();

  const { sidebarOpen, toggleSidebar } = useSidebar(false);

  // 会話変更時のメッセージ読み込み
  useEffect(() => {
    const loadMessages = async () => {
      console.log(`🔍 [useChat] loadMessages開始 - selectedId: "${selectedId}"`);
      
      if (!selectedId || selectedId === '') {
        console.log('🔍 [useChat] selectedIdが空のため、メッセージをクリア');
        setMessages([]);
        return;
      }

      try {
        // DBからメッセージを取得
        console.log(`🔍 [useChat] DB読み込み開始 - conversation_id: ${selectedId}`);
        const dbMessages = await fetchMessages(selectedId);
        console.log(`🔍 [useChat] DB読み込み結果 - ${dbMessages?.length || 0}件:`, dbMessages?.map(m => ({ role: m.role, content: m.content?.substring(0, 20) + '...' })));
        
        if (dbMessages && dbMessages.length > 0) {
          const messages: Message[] = dbMessages.map((m) => ({
            id: String(m.id),
            role: m.role as Message['role'],
            content: m.content,
            type: m.type as 'text' | 'image',
            prompt: m.prompt || undefined,
            imageUrl: m.image_url || undefined,
            timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
          }));
          console.log(`🔍 [useChat] 変換されたメッセージ ${messages.length}件をセット`);
          setMessages(messages);
        } else {
          console.log('🔍 [useChat] DBにメッセージが無いため、空配列をセット');
          setMessages([]);
        }
      } catch (error) {
        logger.error('メッセージ読み込みエラー:', error);
        console.error('🔍 [useChat] メッセージ読み込みエラー:', error);
        // エラー時はメッセージをクリア
        setMessages([]);
      }
    };

    console.log(`🔍 [useChat] useEffect発火 - selectedId: "${selectedId}"`);
    loadMessages();
  }, [selectedId]);

  // 送信履歴の初期化 - localStorage から読み込み
  useEffect(() => {
    // 送信履歴はlocalStorageのまま（これは会話とは独立した機能）
    try {
      const storedHistory = localStorage.getItem("chatMessageHistory");
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) {
          setMessageHistory(parsed.slice(-100)); // 最大100件に制限
        }
      }
    } catch (error) {
      console.error("送信履歴の読み込みに失敗:", getErrorMessage(error));
    }
  }, []);

  // 送信履歴をlocalStorageに保存
  const saveMessageHistory = useCallback((history: string[]) => {
    try {
      const limitedHistory = history.slice(-100); // 最大100件
      localStorage.setItem("chatMessageHistory", JSON.stringify(limitedHistory));
      setMessageHistory(limitedHistory);
    } catch (error) {
      console.error("送信履歴の保存に失敗:", getErrorMessage(error));
    }
  }, []);

  const newConversation = async () => {
    const id = await createConversation();
    setMessages([]);
  };

  // カスタムsendMessage実装（画像対応など）
  const sendMessage = useCallback(async (text: string, imageFile?: File) => {
    if (!isValidInput(text) && !imageFile) return;

    setError(null);
    setLoading(true);

    try {
      let imageUrl = "";
      
      if (imageFile) {
        // 画像アップロード処理
        const ext = imageFile.name.split('.').pop() || 'png';
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const supabase = createClient();
        
        try {
          const { error: upErr } = await supabase.storage
            .from('chat-images')
            .upload(fileName, imageFile);

          if (upErr) {
            logger.error("画像アップロード失敗:", upErr);
            const errorMsg = upErr.message?.includes('Bucket not found') 
              ? "ストレージバケットが見つかりません。管理者にお問い合わせください。"
              : `画像のアップロードに失敗しました: ${upErr.message}`;
            setError(errorMsg);
            return;
          }
          
          const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(fileName);
          imageUrl = (urlData as any)?.publicUrl || (urlData as any)?.publicURL || "";
          
          if (!imageUrl) {
            logger.error("画像URL取得失敗");
            setError("画像URLの生成に失敗しました。");
            return;
          }
        } catch (uploadError) {
          logger.error("画像アップロード例外:", uploadError);
          setError("画像アップロード中にエラーが発生しました。ネットワーク接続を確認してください。");
          return;
        }
      }

      // 画像アップロード完了後にユーザーメッセージを追加
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
        type: imageFile ? "image" : "text",
        ...(imageFile && { 
          imageUrl: imageUrl,
          prompt: text.trim() || "このチャートを分析してください"
        })
      };
      setMessages(prev => [...prev, userMessage]);

      // ユーザーメッセージをDBに保存
      try {
        await addMessage(
          selectedId,
          "user",
          userMessage.content,
          userMessage.type,
          userMessage.prompt,
          userMessage.imageUrl
        );
        logger.info('[useChat] ユーザーメッセージをDBに保存しました');
      } catch (dbError) {
        logger.warn('[useChat] ユーザーメッセージのDB保存に失敗:', dbError);
      }

      // チャットAPIに送信
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: imageFile ? `${text.trim()}\n\n[画像: ${imageUrl}]` : text.trim(),
          symbol: "BTCUSDT", // デフォルト値
          timeframe: "1h", // デフォルト値
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // APIレスポンスからメッセージ内容を柔軟に取得
      const responseContent = data.response || data.message || data.text || data.content || "応答を受信できませんでした";
      
      // デバッグ用ログ（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        console.log('📨 APIレスポンス受信:', { 
          success: data.success,
          response: data.response,
          message: data.message, 
          extractedContent: responseContent
        });
      }
      
      // アシスタントメッセージを追加
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseContent,
        timestamp: Date.now(),
        type: "text",
      };
      setMessages(prev => [...prev, assistantMessage]);

      // アシスタントメッセージをDBに保存
      try {
        await addMessage(
          selectedId,
          "assistant",
          assistantMessage.content,
          assistantMessage.type
        );
        logger.info('[useChat] アシスタントメッセージをDBに保存しました');
      } catch (dbError) {
        logger.warn('[useChat] アシスタントメッセージのDB保存に失敗:', dbError);
      }

      // 送信成功時に履歴に追加（テキストメッセージのみ）
      if (!imageFile && hasText(text)) {
        const newHistory = [...messageHistory, text.trim()];
        saveMessageHistory(newHistory);
      }
      
      // 履歴ナビゲーション状態をリセット
      setHistoryIndex(-1);
      setOriginalInput("");

    } catch (err) {
      logger.error("メッセージ送信エラー:", err);
      const errorMessage = getErrorMessage(err);
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
  }, [messageHistory, saveMessageHistory, selectedId]);

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
      const message = getErrorMessage(err);
      setError(message);
      logger.error("AIへの画像メッセージ送信失敗:", err);
    }
  }, [sendMessage]);

  // 送信履歴ナビゲーション機能
  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (isEmptyArray(messageHistory)) return;

    if (direction === 'up') {
      // 初回の↑キーでは現在の入力を保存
      if (historyIndex === -1) {
        setOriginalInput(input);
        setHistoryIndex(messageHistory.length - 1);
        setInput(messageHistory[messageHistory.length - 1]);
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(messageHistory[newIndex]);
      }
    } else { // down
      if (historyIndex === -1) return;
      
      if (historyIndex < messageHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(messageHistory[newIndex]);
      } else {
        // 最後まで来たら元の入力に戻す
        setHistoryIndex(-1);
        setInput(originalInput);
        setOriginalInput("");
      }
    }
  }, [messageHistory, historyIndex, input, originalInput]);

  // 履歴状態をリセット（入力変更時）
  const resetHistoryNavigation = useCallback(() => {
    if (historyIndex !== -1) {
      setHistoryIndex(-1);
      setOriginalInput("");
    }
  }, [historyIndex]);

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
    navigateHistory,
    resetHistoryNavigation,
    messageHistory,
  };
}

export default useChat; 