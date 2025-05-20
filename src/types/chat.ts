export interface Conversation {
  id: string;
  title: string;
}

export type ChatRole = "user" | "assistant";

export interface Message {
  id: string
  role: ChatRole;
  content: string;
  /** text または画像データURLを表す */
  type?: 'text' | 'image';
  /** 画像メッセージの場合の付加テキスト */
  prompt?: string;
  /** UNIXタイムスタンプ（ミリ秒） */
  timestamp: number;
}
