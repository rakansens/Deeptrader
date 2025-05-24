"use client";

import { useEffect, useState, useCallback } from "react";
import { logger } from "@/lib/logger";
import { 
  safeGetBoolean, 
  safeSetBoolean, 
  safeGetString, 
  safeSetString, 
  safeGetNumber, 
  safeSetNumber 
} from '@/lib/local-storage-utils';

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
  useEffect(() => {
    try {
      // boolean値
      const voiceValue = safeGetBoolean("voiceInputEnabled", true);
      const speechValue = safeGetBoolean("speechSynthesisEnabled", true);
      
      // string値
      const userAvatarValue = safeGetString("userAvatar");
      const assistantAvatarValue = safeGetString("assistantAvatar");
      const userNameValue = safeGetString("userName", DEFAULT_USER_NAME);
      const assistantNameValue = safeGetString("assistantName", DEFAULT_ASSISTANT_NAME);
      
      // number値
      const speechRateValue = safeGetNumber("speechRate", DEFAULT_SPEECH_RATE);

      console.log("LocalStorageから設定を読み込み:", { voiceValue, speechValue, speechRateValue });
      
      // 状態を設定
      setVoiceInputEnabledState(voiceValue);
      setSpeechSynthesisEnabledState(speechValue);
      setSpeechRateState(speechRateValue);
      setUserNameState(userNameValue);
      setAssistantNameState(assistantNameValue);
      
      if (userAvatarValue) setUserAvatarState(userAvatarValue);
      if (assistantAvatarValue) setAssistantAvatarState(assistantAvatarValue);

    } catch (error) {
      console.error("設定の読み込みに失敗しました:", error);
    }
  }, []);

  // 設定を再読み込みする関数（外部から呼び出し可能）
  // 依存配列を空にして、再レンダリングの原因にならないようにする
  const refreshSettings = useCallback(() => {
    // 設定再読み込み処理（将来的に実装）
    console.log("設定再読み込み実行");
  }, []);

  // 設定変更ハンドラ - 統一ユーティリティ使用
  const setVoiceInputEnabled = useCallback((value: boolean) => {
    // 統一ユーティリティで保存
    safeSetBoolean("voiceInputEnabled", value);
    setVoiceInputEnabledState(value);
    
    // デバッグログ
    console.log("音声入力設定変更:", value);
  }, []);

  const setSpeechSynthesisEnabled = useCallback((value: boolean) => {
    // 統一ユーティリティで保存
    safeSetBoolean("speechSynthesisEnabled", value);
    setSpeechSynthesisEnabledState(value);
    
    console.log("音声読み上げ設定変更:", value);
  }, []);

  const setSpeechRate = useCallback((value: number) => {
    // 範囲制限
    const limitedValue = Math.min(Math.max(value, 0.5), 2.0);
    
    // 統一ユーティリティで保存
    safeSetNumber("speechRate", limitedValue);
    setSpeechRateState(limitedValue);
    
    console.log("読み上げ速度変更:", limitedValue);
  }, []);

  const setUserName = useCallback((nameValue: string) => {
    // 統一ユーティリティで保存
    safeSetString("userName", nameValue);
    setUserNameState(nameValue);
    
    console.log("ユーザー名変更:", nameValue);
  }, []);

  const setAssistantName = useCallback((nameValue: string) => {
    // 統一ユーティリティで保存
    safeSetString("assistantName", nameValue);
    setAssistantNameState(nameValue);
    
    console.log("アシスタント名変更:", nameValue);
  }, []);

  const setUserAvatar = useCallback((value: string) => {
    safeSetString("userAvatar", value);
    setUserAvatarState(value);
  }, []);

  const setAssistantAvatar = useCallback((value: string) => {
    safeSetString("assistantAvatar", value);
    setAssistantAvatarState(value);
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
