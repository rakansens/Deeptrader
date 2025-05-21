import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * localStorageから安全にJSONを読み込む
 * @param key - ストレージキー
 * @param label - ログ用ラベル
 * @returns パースされたデータ、存在しない場合やエラー時は null
 */
export function safeLoadJson<T>(key: string, label = 'data'): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (parseError) {
      console.warn(`Failed to parse ${label} from localStorage (key: ${key}):`, parseError);
      return null;
    }
  } catch (e) {
    console.warn(`Error accessing ${label} from localStorage (key: ${key}):`, e);
    return null;
  }
}

/**
 * JSONをlocalStorageへ安全に保存する
 * @param key - ストレージキー
 * @param value - 保存する値
 * @param label - ログ用ラベル
 */
export function safeSaveJson(key: string, value: unknown, label = 'data'): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${label} to localStorage (key: ${key}):`, e);
  }
}
