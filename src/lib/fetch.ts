"use strict";
/**
 * fetch API をタイムアウト付きで実行するヘルパー
 * @param url - リクエスト先 URL
 * @param options - fetch のオプション, timeout(ms) を指定可能
 */
export async function fetchWithTimeout(
  url: RequestInfo | URL,
  options: (RequestInit & { timeout?: number }) = {}
): Promise<Response> {
  const { timeout = 10000, ...init } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } catch (err: unknown) {
    if ((err as Error)?.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
