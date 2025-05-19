"use client";

import { useEffect, useState } from "react";

export interface UseSettings {
  voiceInputEnabled: boolean;
  setVoiceInputEnabled: (v: boolean) => void;
  speechSynthesisEnabled: boolean;
  setSpeechSynthesisEnabled: (v: boolean) => void;
}

/**
 * 音声入力と読み上げ設定を管理するフック
 */
export function useSettings(): UseSettings {
  const [voiceInputEnabled, setVoiceInputEnabledState] = useState(false);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabledState] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 設定変更ハンドラ - localStorageに直接保存し、状態も更新
  const setVoiceInputEnabled = (value: boolean) => {
    console.log("音声入力設定を変更:", value);
    try {
      localStorage.setItem("voiceInputEnabled", String(value));
      setVoiceInputEnabledState(value);
    } catch (e) {
      console.error("設定の保存に失敗:", e);
    }
  };

  const setSpeechSynthesisEnabled = (value: boolean) => {
    console.log("読み上げ設定を変更:", value);
    try {
      localStorage.setItem("speechSynthesisEnabled", String(value));
      setSpeechSynthesisEnabledState(value);
    } catch (e) {
      console.error("設定の保存に失敗:", e);
    }
  };

  // 初期状態をlocalStorageから読み込む
  useEffect(() => {
    try {
      const v = localStorage.getItem("voiceInputEnabled");
      const s = localStorage.getItem("speechSynthesisEnabled");
      
      console.log("localStorageから読み込み - 音声入力:", v);
      console.log("localStorageから読み込み - 読み上げ:", s);
      
      if (v !== null) setVoiceInputEnabledState(v === "true");
      if (s !== null) setSpeechSynthesisEnabledState(s === "true");
      
      setInitialized(true);
    } catch (e) {
      console.error("設定の読み込みに失敗:", e);
      setInitialized(true);
    }
  }, []);

  // デバッグ用: 状態が変更されたときにログ出力
  useEffect(() => {
    if (initialized) {
      console.log("設定状態変更 - 音声入力:", voiceInputEnabled);
      console.log("設定状態変更 - 読み上げ:", speechSynthesisEnabled);
    }
  }, [voiceInputEnabled, speechSynthesisEnabled, initialized]);

  return {
    voiceInputEnabled,
    setVoiceInputEnabled,
    speechSynthesisEnabled,
    setSpeechSynthesisEnabled,
  };
}

export default useSettings;
