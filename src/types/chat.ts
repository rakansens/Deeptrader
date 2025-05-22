export interface Conversation {
  id: string;
  title: string;
}

export type ChatRole = "user" | "assistant";

/**
 * Mastra / DeepTrader 共通メッセージ型
 * （旧 OpenAI 互換型は廃止）
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface Message {
  id: string
  role: ChatRole;
  content: string;
  /** text または画像データURLを表す */
  type?: 'text' | 'image';
  /** 画像メッセージの場合の付加テキスト */
  prompt?: string;
  /** 画像がSupabaseにアップロードされた場合の公開URL */
  imageUrl?: string;
  /** UNIXタイムスタンプ（ミリ秒） */
  timestamp: number;
}
