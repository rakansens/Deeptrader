export interface Conversation {
  id: string;
  title: string;
}

export type ChatRole = "user" | "assistant";

export type OpenAIContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface OpenAIChatMessage {
  role: ChatRole | 'system';
  content: string | OpenAIContent[];
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
