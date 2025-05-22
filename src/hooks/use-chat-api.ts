"use client";

import { useState, useCallback } from "react";
import { Message } from "@/types";
import { logger } from "@/lib/logger";

/**
 * チャットAPIとのやり取りを管理するフック
 */
export function useChatApi() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * メッセージを送信し、AIからの応答を取得する
   */
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // 一意のIDを生成
    const messageId = Date.now().toString();
    
    const userMessage: Message = {
      id: messageId,
      role: "user",
      content: input,
      timestamp: Date.now(),
      type: "text"
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      logger.debug("Chat APIリクエスト送信: ", {
        message: input,
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "AIメッセージの生成に失敗しました");
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        type: "text"
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      logger.error("Chat APIエラー:", err);
      setError(err instanceof Error ? err.message : "AIとの通信中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  /**
   * 画像をアップロードし、メッセージに添付する
   */
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "画像のアップロードに失敗しました");
      }

      const { imageUrl } = await uploadResponse.json();

      const imageMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: "画像を送信しました",
        imageUrl,
        timestamp: Date.now(),
        type: "image",
      };

      setMessages((prev) => [...prev, imageMessage]);
      
      // 画像分析を自動的にリクエスト
      setIsLoading(true);
      setError(null);

      const analysisResponse = await fetch("/api/image-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          messages: [...messages, imageMessage],
        }),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || "画像分析に失敗しました");
      }

      const data = await analysisResponse.json();
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        type: "text"
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      logger.error("画像アップロードエラー:", err);
      setError(err instanceof Error ? err.message : "画像のアップロードに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  /**
   * チャートのスクリーンショットを取得し分析する
   */
  const takeScreenshot = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // スクリーンショットAPIを呼び出し
      const response = await fetch("/api/chart-screenshot", {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "チャートのスクリーンショットに失敗しました");
      }

      const { imageUrl } = await response.json();

      // スクリーンショットメッセージをチャットに追加
      const screenshotMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: "チャートを送信しました",
        imageUrl,
        timestamp: Date.now(),
        type: "image",
        prompt: "チャートの分析をお願いします"
      };

      setMessages((prev) => [...prev, screenshotMessage]);

      // チャート分析を自動的にリクエスト
      const analysisResponse = await fetch("/api/chart-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          messages: [...messages, screenshotMessage],
        }),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || "チャート分析に失敗しました");
      }

      const data = await analysisResponse.json();
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        type: "text"
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      logger.error("チャートスクリーンショットエラー:", err);
      setError(err instanceof Error ? err.message : "チャートの分析に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    handleSubmit,
    handleImageUpload,
    takeScreenshot,
  };
}

export default useChatApi; 