"use client";

import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useEffect, useState, useCallback, useRef } from "react";
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
 * Mastraストリーミングに対応した完全カスタム実装
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
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 重複実行防止フラグ
  const isExecutingRef = useRef(false);
  // 最新のメッセージを参照するためのRef（useCallbackの依存関係問題を回避）
  const messagesRef = useRef<Message[]>([]);
  
  const { sidebarOpen, toggleSidebar } = useSidebar(false);

  // メッセージが更新されたらRefも更新
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 会話変更時のメッセージリセット
  useEffect(() => {
    setMessages([]);
  }, [selectedId]);

  const newConversation = async () => {
    const id = await createConversation();
    setMessages([]);
  };

  // MastraのJSONストリームをパースする関数
  const parseMastraJSONStream = useCallback((jsonText: string): string => {
    let finalText = "";
    
    try {
      const lines = jsonText.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            
            if (parsed.part?.type === "text-delta" && parsed.part.textDelta) {
              finalText += parsed.part.textDelta;
            }
          } catch (parseError) {
            continue;
          }
        }
      }
    } catch (error) {
      logger.warn("JSONストリームパースエラー:", error);
      return jsonText;
    }
    
    return finalText || "パースされたテキストが空でした";
  }, []);

  const sendMessage = useCallback(async (textParam?: string, imageFile?: File) => {
    const text = (textParam ?? input).trim();
    if (!text && !imageFile) return;

    // 重複実行防止（React Strict Mode対応強化版）
    if (isExecutingRef.current) {
      console.log("⚠️ 重複実行をブロックしました - 既に実行中");
      return;
    }
    
    // 実行開始フラグを即座に設定
    isExecutingRef.current = true;
    console.log("🚀 sendMessage実行開始");
    
    setError(null);
    setIsLoading(true);
    
    let uiContent = text;
    let messageType: Message['type'] = 'text';
    let uiImageUrl: string | undefined;
    let promptForDb = text;

    try {
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
        uiImageUrl = (urlData as any)?.publicUrl || (urlData as any)?.publicURL || "";
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: imageFile ? uiContent : text,
        type: messageType,
        prompt: imageFile ? promptForDb : undefined,
        imageUrl: uiImageUrl,
        timestamp: Date.now(),
      };
      
      // ユーザーメッセージを追加
      setMessages(prev => [...prev, userMessage]);
      
      // 入力をクリア
      if (!imageFile) { 
        setInput("");
      }

      // API呼び出し（重複防止を考慮した単一実行）
      console.log("📡 API呼び出し開始");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messagesRef.current.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      
      console.log("=== MAIN CHAT DEBUG START ===");
      console.log("🔍 Response Content-Type:", contentType);
      console.log("🔍 Response ok:", response.ok);
      console.log("=== MAIN CHAT DEBUG END ===");
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        const content = data.message || "レスポンスが取得できませんでした";
        
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
          timestamp: Date.now(),
          type: "text"
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else if (contentType?.includes('text/plain')) {
        console.log("📄 プレーンテキストレスポンス - 内容を確認中...");
        const responseText = await response.text();
        console.log("📄 受信テキスト:", responseText.substring(0, 200) + "...");
        
        // JSONストリーミング形式（{"part":）かどうかチェック
        if (responseText.trim().startsWith('{"part":')) {
          console.log("🌊 text/plainだがJSONストリーミングとして処理");
          // JSONストリーミング形式なのでパース処理
          const finalText = parseMastraJSONStream(responseText);
          
          const aiMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: finalText,
            timestamp: Date.now(),
            type: "text"
          };
          
          setMessages(prev => [...prev, aiMessage]);
        } else {
          console.log("📄 純粋なプレーンテキストとして処理");
          // 純粋なプレーンテキストの場合はそのまま表示
          const aiMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: responseText,
            timestamp: Date.now(),
            type: "text"
          };
          
          setMessages(prev => [...prev, aiMessage]);
        }
      } else if (response.body) {
        const aiMessageId = crypto.randomUUID();
        
        const aiMessage: Message = {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          type: "text"
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const parsed = JSON.parse(line);
                  
                  if (parsed.part?.type === "text-delta" && parsed.part.textDelta) {
                    setMessages(prev => 
                      prev.map(msg => 
                        msg.id === aiMessageId 
                          ? { ...msg, content: msg.content + parsed.part.textDelta }
                          : msg
                      )
                    );
                  }
                } catch (parseError) {
                  continue;
                }
              }
            }
          }
        } catch (streamError) {
          logger.error("ストリーミング読み取りエラー:", streamError);
          throw streamError;
        }
      }

    } catch (err) {
      logger.error("チャットAPI呼び出しエラー:", err);
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました";
      setError(errorMessage);
      
      const errorAIMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `申し訳ありません。エラーが発生しました: ${errorMessage}`,
        timestamp: Date.now(),
        type: "text"
      };
      
      setMessages(prev => [...prev, errorAIMessage]);
    } finally {
      console.log("🏁 sendMessage実行完了");
      setIsLoading(false);
      isExecutingRef.current = false;
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
