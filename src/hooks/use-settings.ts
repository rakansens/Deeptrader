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
  speechRate: number;
  setSpeechRate: (v: number) => void;
  userName: string;
  setUserName: (v: string) => void;
  assistantName: string;
  setAssistantName: (v: string) => void;
  refreshSettings: () => void; // 設定を再読み込みするための関数を追加
}

// 音声読み上げ速度のデフォルト値と範囲
export const DEFAULT_SPEECH_RATE = 1.0;
export const MIN_SPEECH_RATE = 0.5;
export const MAX_SPEECH_RATE = 2.0;

// 名前のデフォルト値
export const DEFAULT_USER_NAME = "あなた";
export const DEFAULT_ASSISTANT_NAME = "DeepTrader AI";

/**
 * 音声入力と読み上げ設定を管理するフック
 */
export function useSettings(): UseSettings {
  // デフォルト値として、音声入力と読み上げは有効に設定
  const [voiceInputEnabled, setVoiceInputEnabledState] =
    useState<boolean>(true);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabledState] =
    useState<boolean>(true);
  const [userAvatar, setUserAvatarState] = useState<string | undefined>(
    undefined,
  );
  const [assistantAvatar, setAssistantAvatarState] = useState<
    string | undefined
  >(undefined);
  const [speechRate, setSpeechRateState] = useState<number>(DEFAULT_SPEECH_RATE);
  const [userName, setUserNameState] = useState<string>(DEFAULT_USER_NAME);
  const [assistantName, setAssistantNameState] = useState<string>(DEFAULT_ASSISTANT_NAME);
  const [initialized, setInitialized] = useState<boolean>(false);

  // LocalStorageから設定を読み込む
  const loadSettings = useCallback(() => {
    try {
      if (typeof window === 'undefined') return; // SSR環境ではスキップ
      
      const voiceValue = localStorage.getItem("voiceInputEnabled");
      const speechValue = localStorage.getItem("speechSynthesisEnabled");
      const userAvatarValue = localStorage.getItem("userAvatar");
      const assistantAvatarValue = localStorage.getItem("assistantAvatar");
      const speechRateValue = localStorage.getItem("speechRate");
      const userNameValue = localStorage.getItem("userName");
      const assistantNameValue = localStorage.getItem("assistantName");

      console.log("LocalStorageから設定を読み込み:", { voiceValue, speechValue, speechRateValue });

      // 明示的に変換して型安全性を確保
      if (voiceValue !== null) {
        const parsedVoice = voiceValue === "true";
        setVoiceInputEnabledState(parsedVoice);
      } else {
        // 設定がなければデフォルトでtrue（音声入力は有効）
        setVoiceInputEnabledState(true);
        // 初期値をlocalStorageに保存
        localStorage.setItem("voiceInputEnabled", "true");
      }

      if (speechValue !== null) {
        const parsedSpeech = speechValue === "true";
        setSpeechSynthesisEnabledState(parsedSpeech);
      } else {
        // 設定がなければデフォルトでtrue（読み上げは有効）
        setSpeechSynthesisEnabledState(true);
        // 初期値をlocalStorageに保存
        localStorage.setItem("speechSynthesisEnabled", "true");
      }

      if (speechRateValue !== null) {
        const parsedRate = parseFloat(speechRateValue);
        if (!isNaN(parsedRate) && parsedRate >= MIN_SPEECH_RATE && parsedRate <= MAX_SPEECH_RATE) {
          setSpeechRateState(parsedRate);
        }
      } else {
        // デフォルト値をlocalStorageに保存
        localStorage.setItem("speechRate", String(DEFAULT_SPEECH_RATE));
      }

      // ユーザー名の読み込み
      if (userNameValue !== null && userNameValue.trim() !== '') {
        setUserNameState(userNameValue);
      } else {
        // デフォルト値をlocalStorageに保存
        localStorage.setItem("userName", DEFAULT_USER_NAME);
      }
      
      // アシスタント名の読み込み
      if (assistantNameValue !== null && assistantNameValue.trim() !== '') {
        setAssistantNameState(assistantNameValue);
      } else {
        // デフォルト値をlocalStorageに保存
        localStorage.setItem("assistantName", DEFAULT_ASSISTANT_NAME);
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
      
      console.log("音声入力設定を変更:", { newValue: value });
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

  const setSpeechRate = useCallback((value: number) => {
    try {
      // 範囲を制限
      const limitedValue = Math.max(MIN_SPEECH_RATE, Math.min(MAX_SPEECH_RATE, value));
      // localStorageに保存
      localStorage.setItem("speechRate", String(limitedValue));
      // 状態を更新
      setSpeechRateState(limitedValue);
    } catch (error) {
      logger.error("[useSettings] 読み上げ速度設定の保存に失敗:", error);
    }
  }, []);

  const setUserName = useCallback((value: string) => {
    try {
      // 空白の場合はデフォルト値を使用
      const nameValue = value.trim() ? value : DEFAULT_USER_NAME;
      // localStorageに保存
      localStorage.setItem("userName", nameValue);
      // 状態を更新
      setUserNameState(nameValue);
    } catch (error) {
      logger.error("[useSettings] ユーザー名設定の保存に失敗:", error);
    }
  }, []);

  const setAssistantName = useCallback((value: string) => {
    try {
      // 空白の場合はデフォルト値を使用
      const nameValue = value.trim() ? value : DEFAULT_ASSISTANT_NAME;
      // localStorageに保存
      localStorage.setItem("assistantName", nameValue);
      // 状態を更新
      setAssistantNameState(nameValue);
    } catch (error) {
      logger.error("[useSettings] アシスタント名設定の保存に失敗:", error);
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
    speechRate,
    setSpeechRate,
    userName,
    setUserName,
    assistantName,
    setAssistantName,
    refreshSettings,
  };
}

export default useSettings;
