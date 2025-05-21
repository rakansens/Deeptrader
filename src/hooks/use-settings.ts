"use client";

import { useEffect, useState, useCallback } from "react";
import { logger } from "@/lib/logger";

export interface UseSettings {
  voiceInputEnabled: boolean;
  setVoiceInputEnabled: (v: boolean) => void;
  speechSynthesisEnabled: boolean;
  setSpeechSynthesisEnabled: (v: boolean) => void;
  userAvatar?: string;
  setUserAvatar: (v: string) => void;
  assistantAvatar?: string;
  setAssistantAvatar: (v: string) => void;
  refreshSettings: () => void; // 設定を再読み込みするための関数を追加
}

/**
 * 音声入力と読み上げ設定を管理するフック
 */
export function useSettings(): UseSettings {
  const [voiceInputEnabled, setVoiceInputEnabledState] =
    useState<boolean>(false);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabledState] =
    useState<boolean>(false);
  const [userAvatar, setUserAvatarState] = useState<string | undefined>(
    undefined,
  );
  const [assistantAvatar, setAssistantAvatarState] = useState<
    string | undefined
  >(undefined);
  const [initialized, setInitialized] = useState<boolean>(false);

  // LocalStorageから設定を読み込む
  const loadSettings = useCallback(() => {
    try {
      const voiceValue = localStorage.getItem("voiceInputEnabled");
      const speechValue = localStorage.getItem("speechSynthesisEnabled");
      const userAvatarValue = localStorage.getItem("userAvatar");
      const assistantAvatarValue = localStorage.getItem("assistantAvatar");

      // 明示的に変換して型安全性を確保
      if (voiceValue !== null) {
        const parsedVoice = voiceValue === "true";
        setVoiceInputEnabledState(parsedVoice);
      }

      if (speechValue !== null) {
        const parsedSpeech = speechValue === "true";
        setSpeechSynthesisEnabledState(parsedSpeech);
      }

      if (userAvatarValue !== null) {
        setUserAvatarState(userAvatarValue || undefined);
      }

      if (assistantAvatarValue !== null) {
        setAssistantAvatarState(assistantAvatarValue || undefined);
      }
    } catch (error) {
      logger.error("[useSettings] 設定読み込みエラー:", error);
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

  // storageイベントに反応して設定を更新
  useEffect(() => {
    const handleStorage = () => {
      loadSettings();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadSettings]);

  // 設定変更ハンドラ - localStorageに直接保存し、状態も更新
  const setVoiceInputEnabled = useCallback((value: boolean) => {
    try {
      // まずlocalStorageに保存
      localStorage.setItem("voiceInputEnabled", String(value));
      // 次に状態を更新
      setVoiceInputEnabledState(value);
    } catch (error) {
      logger.error("[useSettings] 音声入力設定の保存に失敗:", error);
    }
  }, []);

  const setSpeechSynthesisEnabled = useCallback((value: boolean) => {
    try {
      // まずlocalStorageに保存
      localStorage.setItem("speechSynthesisEnabled", String(value));
      // 次に状態を更新
      setSpeechSynthesisEnabledState(value);
    } catch (error) {
      logger.error("[useSettings] 読み上げ設定の保存に失敗:", error);
    }
  }, []);

  const setUserAvatar = useCallback((value: string) => {
    try {
      localStorage.setItem("userAvatar", value);
      setUserAvatarState(value);
    } catch (error) {
      logger.error("[useSettings] ユーザーアイコンの保存に失敗:", error);
    }
  }, []);

  const setAssistantAvatar = useCallback((value: string) => {
    try {
      localStorage.setItem("assistantAvatar", value);
      setAssistantAvatarState(value);
    } catch (error) {
      logger.error("[useSettings] AIアイコンの保存に失敗:", error);
    }
  }, []);

  return {
    voiceInputEnabled,
    setVoiceInputEnabled,
    speechSynthesisEnabled,
    setSpeechSynthesisEnabled,
    userAvatar,
    setUserAvatar,
    assistantAvatar,
    setAssistantAvatar,
    refreshSettings,
  };
}

export default useSettings;
