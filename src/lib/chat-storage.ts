import type { Message } from "@/types";

/**
 * localStorageからメッセージを読み込む
 * @param id - 会話ID
 * @returns メッセージ配列
 */
export function loadMessages(id: string): Message[] {
  try {
    const stored = localStorage.getItem(`messages_${id}`);
    const parsed = stored ? (JSON.parse(stored) as Partial<Message>[]) : [];
    return parsed.map((m) => ({
      id: m.id ?? crypto.randomUUID(),
      role: m.role as Message["role"],
      content: m.content ?? "",
      timestamp: m.timestamp ?? Date.now(),
    }));
  } catch {
    return [];
  }
}

/**
 * メッセージをlocalStorageへ保存する
 * @param id - 会話ID
 * @param messages - 保存するメッセージ配列
 */
export function saveMessages(id: string, messages: Message[]): void {
  try {
    localStorage.setItem(`messages_${id}`, JSON.stringify(messages));
  } catch {
    // ignore write errors
  }
}
