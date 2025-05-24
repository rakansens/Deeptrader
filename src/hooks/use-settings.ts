"use client";

import { useEffect, useState, useCallback } from "react";
import { logger } from "@/lib/logger";
import { useUserPreferences } from "./use-user-preferences";

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
  refreshSettings: () => void;
}

// デフォルト値と範囲
export const DEFAULT_SPEECH_RATE = 1.0;
export const MIN_SPEECH_RATE = 0.5;
export const MAX_SPEECH_RATE = 2.0;
export const DEFAULT_USER_NAME = "あなた";
export const DEFAULT_ASSISTANT_NAME = "DeepTrader AI";

/**
 * 音声入力と読み上げ設定を管理するフック
 * DBベース実装（user_preferencesテーブル使用）
 */
export function useSettings(): UseSettings {
  const { 
    audioSettings, 
    themeSettings, 
    updateAudioSettings, 
    updateThemeSettings, 
    setPreference,
    getPreference,
    isLoading 
  } = useUserPreferences();
  
  // ローカル状態（DBから読み込み完了まで使用）
  const [voiceInputEnabled, setVoiceInputEnabledState] = useState<boolean>(true);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabledState] = useState<boolean>(true);
  const [userAvatar, setUserAvatarState] = useState<string | undefined>(undefined);
  const [assistantAvatar, setAssistantAvatarState] = useState<string | undefined>(undefined);
  const [speechRate, setSpeechRateState] = useState<number>(DEFAULT_SPEECH_RATE);
  const [userName, setUserNameState] = useState<string>(DEFAULT_USER_NAME);
  const [assistantName, setAssistantNameState] = useState<string>(DEFAULT_ASSISTANT_NAME);

  // DBから設定を読み込み
  useEffect(() => {
    if (isLoading) return;

    try {
      // 音声設定（audioSettingsから取得）
      setVoiceInputEnabledState(audioSettings.voice_enabled);
      setSpeechSynthesisEnabledState(getPreference('audio', 'speech_enabled') ?? true);
      setSpeechRateState(getPreference('audio', 'speech_rate') ?? DEFAULT_SPEECH_RATE);
      
      // テーマ設定（個別に取得）
      const userAvatarValue = getPreference('theme', 'user_avatar');
      const assistantAvatarValue = getPreference('theme', 'assistant_avatar');
      const userNameValue = getPreference('theme', 'user_name') ?? DEFAULT_USER_NAME;
      const assistantNameValue = getPreference('theme', 'assistant_name') ?? DEFAULT_ASSISTANT_NAME;

      console.log("DBから設定を読み込み:", { 
        voiceEnabled: audioSettings.voice_enabled, 
        speechEnabled: getPreference('audio', 'speech_enabled'),
        speechRate: getPreference('audio', 'speech_rate') 
      });
      
      // 状態を設定
      setUserNameState(userNameValue);
      setAssistantNameState(assistantNameValue);
      
      if (userAvatarValue) setUserAvatarState(userAvatarValue);
      if (assistantAvatarValue) setAssistantAvatarState(assistantAvatarValue);

    } catch (error) {
      logger.error("DB設定の読み込みに失敗しました:", error);
    }
  }, [audioSettings, themeSettings, getPreference, isLoading]);

  // 設定を再読み込みする関数
  const refreshSettings = useCallback(() => {
    console.log("設定再読み込み実行");
    // preferencesは自動的に更新されるため、特別な処理は不要
  }, []);

  // 設定変更ハンドラ - DB保存
  const setVoiceInputEnabled = useCallback(async (value: boolean) => {
    setVoiceInputEnabledState(value);
    await updateAudioSettings({ voice_enabled: value });
    console.log("音声入力設定変更:", value);
  }, [updateAudioSettings]);

  const setSpeechSynthesisEnabled = useCallback(async (value: boolean) => {
    setSpeechSynthesisEnabledState(value);
    await setPreference('audio', 'speech_enabled', value);
    console.log("音声読み上げ設定変更:", value);
  }, [setPreference]);

  const setSpeechRate = useCallback(async (value: number) => {
    const limitedValue = Math.min(Math.max(value, MIN_SPEECH_RATE), MAX_SPEECH_RATE);
    setSpeechRateState(limitedValue);
    await setPreference('audio', 'speech_rate', limitedValue);
    console.log("読み上げ速度変更:", limitedValue);
  }, [setPreference]);

  const setUserName = useCallback(async (nameValue: string) => {
    setUserNameState(nameValue);
    await setPreference('theme', 'user_name', nameValue);
    console.log("ユーザー名変更:", nameValue);
  }, [setPreference]);

  const setAssistantName = useCallback(async (nameValue: string) => {
    setAssistantNameState(nameValue);
    await setPreference('theme', 'assistant_name', nameValue);
    console.log("アシスタント名変更:", nameValue);
  }, [setPreference]);

  const setUserAvatar = useCallback(async (value: string) => {
    setUserAvatarState(value);
    await setPreference('theme', 'user_avatar', value);
    console.log("ユーザーアバター変更:", value);
  }, [setPreference]);

  const setAssistantAvatar = useCallback(async (value: string) => {
    setAssistantAvatarState(value);
    await setPreference('theme', 'assistant_avatar', value);
    console.log("アシスタントアバター変更:", value);
  }, [setPreference]);

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
