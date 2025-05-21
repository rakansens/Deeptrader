"use client";

import { useRef, useState } from "react";

interface UseVoiceInputOptions {
  onResult?: (text: string) => void;
  lang?: string;
  playSound?: boolean;
}

interface UseVoiceInput {
  isListening: boolean;
  recordingTime: number;
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
  playSound = false,
}: UseVoiceInputOptions = {}): UseVoiceInput {
  const [isListening, setIsListening] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSendingRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const beep = () => {
    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 440;
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      /* noop */
    }
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
    setRecordingTime(0);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.stop();
      recognitionRef.current.abort?.();
      recognitionRef.current = null;
      clearTimer();
      setIsListening(false);
      if (playSound) beep();
    }
  };

  const startListening = () => {
    // 既に音声認識中なら何もしない
    if (isListening && recognitionRef.current) {
      return;
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // ブラウザが音声認識をサポートしていない場合
    if (!SpeechRecognitionCtor) {
      return;
    }

    const rec: SpeechRecognition = new SpeechRecognitionCtor();
    recognitionRef.current = rec;
    rec.lang = lang;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      // 無効化済みインスタンスや送信中は無視
      if (rec !== recognitionRef.current || isSendingRef.current) return;

      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      
      if (onResult) {
        onResult(text);
      }
      
      clearTimer();
      setIsListening(false);
    };
    rec.onend = () => {
      clearTimer();
      setIsListening(false);
    };
    rec.onerror = () => {
      clearTimer();
      setIsListening(false);
    };
    rec.start();
    startTimeRef.current = Date.now();
    setRecordingTime(0);
    timerRef.current = window.setInterval(() => {
      if (startTimeRef.current != null) {
        setRecordingTime(Date.now() - startTimeRef.current);
      }
    }, 1000);
    setIsListening(true);
    if (playSound) beep();
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
    recordingTime,
    startListening,
    stopListening,
    toggleListening,
  };
}

export default useVoiceInput;
