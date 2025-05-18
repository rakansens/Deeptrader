export interface Conversation {
  id: string;
  title: string;
}

export type ChatRole = "user" | "assistant";

export interface Message {
  role: ChatRole;
  content: string;
}
