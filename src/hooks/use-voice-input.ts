"use client";

import { useRef, useState } from "react";

interface UseVoiceInputOptions {
  onResult?: (text: string) => void;
  lang?: string;
}

interface UseVoiceInput {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

/**
 * 音声入力を管理するカスタムフック
 */
export function useVoiceInput({
  onResult,
  lang = "ja-JP",
}: UseVoiceInputOptions = {}): UseVoiceInput {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isSendingRef = useRef(false);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.stop();
      recognitionRef.current.abort?.();
      recognitionRef.current = null;
      setIsListening(false);
    }
  };

  const startListening = () => {
    // 既に音声認識中なら何もしない
    if (isListening && recognitionRef.current) {
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    // ブラウザが音声認識をサポートしていない場合
    if (!SpeechRecognition) {
      return;
    }
    
    const rec: any = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.lang = lang;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      // 無効化済みインスタンスや送信中は無視
      if (rec !== recognitionRef.current || isSendingRef.current) return;

      const text = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join("");
      
      if (onResult) {
        onResult(text);
      }
      
      setIsListening(false);
    };
    rec.onend = () => {
      setIsListening(false);
    };
    rec.onerror = () => {
      setIsListening(false);
    };
    rec.start();
    setIsListening(true);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    isListening,
    startListening,
    stopListening,
    toggleListening,
  };
}

export default useVoiceInput;
