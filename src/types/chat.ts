export interface Conversation {
  id: string;
  title: string;
}

export type ChatRole = "user" | "assistant";

export interface Message {
  id: string
  role: ChatRole;
  content: string;
  /** UNIXタイムスタンプ（ミリ秒） */
  timestamp: number;
}
