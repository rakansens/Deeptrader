/**
 * テキストを音声で読み上げるユーティリティ
 */

import { logger } from '@/lib/logger';

// 読み上げを停止する
export function stopSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// テキストを読み上げる
export function speakText(text: string, lang = 'ja-JP') {
  if (!window.speechSynthesis) {
    logger.error('Speech synthesis is not supported in this browser');
    return;
  }

  // 既存の発話をキャンセル
  stopSpeech();

  // UTTeranceを作成
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  
  // 読み上げ開始
  window.speechSynthesis.speak(utterance);
  
  return utterance;
}

// 読み上げが利用可能かどうか確認
export function isSpeechAvailable(): boolean {
  return !!window.speechSynthesis;
}

// 日本語の音声を優先して取得
export function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (!window.speechSynthesis) return null;
  
  const voices = window.speechSynthesis.getVoices();
  
  // 日本語の音声を優先
  const jaVoice = voices.find(voice => voice.lang === 'ja-JP');
  if (jaVoice) return jaVoice;
  
  // 日本語がなければ、デフォルト音声を返す
  return voices.length > 0 ? voices[0] : null;
} 
