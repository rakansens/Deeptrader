"use client";

import { useEffect, useState, useCallback } from "react";

export interface UseSettings {
  voiceInputEnabled: boolean;
  setVoiceInputEnabled: (v: boolean) => void;
  speechSynthesisEnabled: boolean;
  setSpeechSynthesisEnabled: (v: boolean) => void;
  refreshSettings: () => void; // 設定を再読み込みするための関数を追加
}

/**
 * 音声入力と読み上げ設定を管理するフック
 */
export function useSettings(): UseSettings {
  const [voiceInputEnabled, setVoiceInputEnabledState] = useState<boolean>(false);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabledState] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  // LocalStorageから設定を読み込む
  const loadSettings = useCallback(() => {
    try {
      const voiceValue = localStorage.getItem("voiceInputEnabled");
      const speechValue = localStorage.getItem("speechSynthesisEnabled");
      
      // 明示的に変換して型安全性を確保
      if (voiceValue !== null) {
        const parsedVoice = voiceValue === "true";
        setVoiceInputEnabledState(parsedVoice);
      }
      
      if (speechValue !== null) {
        const parsedSpeech = speechValue === "true";
        setSpeechSynthesisEnabledState(parsedSpeech);
      }
      
    } catch (error) {
      console.error("[useSettings] 設定読み込みエラー:", error);
    }
  }, []);

  // 設定を再読み込みする関数（外部から呼び出し可能）
  // 依存配列を空にして、再レンダリングの原因にならないようにする
  const refreshSettings = useCallback(() => {
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 初期化時に一度だけ実行
  useEffect(() => {
    if (!initialized) {
      loadSettings();
      setInitialized(true);
    }
  }, [initialized, loadSettings]);

  // 設定変更ハンドラ - localStorageに直接保存し、状態も更新
  const setVoiceInputEnabled = useCallback((value: boolean) => {
    try {
      // まずlocalStorageに保存
      localStorage.setItem("voiceInputEnabled", String(value));
      // 次に状態を更新
      setVoiceInputEnabledState(value);
    } catch (error) {
      console.error("[useSettings] 音声入力設定の保存に失敗:", error);
    }
  }, []);

  const setSpeechSynthesisEnabled = useCallback((value: boolean) => {
    try {
      // まずlocalStorageに保存
      localStorage.setItem("speechSynthesisEnabled", String(value));
      // 次に状態を更新
      setSpeechSynthesisEnabledState(value);
    } catch (error) {
      console.error("[useSettings] 読み上げ設定の保存に失敗:", error);
    }
  }, []);

  return {
    voiceInputEnabled,
    setVoiceInputEnabled,
    speechSynthesisEnabled,
    setSpeechSynthesisEnabled,
    refreshSettings,
  };
}

export default useSettings;
