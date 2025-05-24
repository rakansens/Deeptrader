// src/lib/local-storage-utils.ts
// localStorage統一ユーティリティ - Phase 6A-6統合
// 15+箇所のlocalStorage操作を安全な共通関数に統一

/**
 * localStorageから安全にJSONオブジェクトを読み込む
 */
export function safeGetJson<T>(key: string, defaultValue: T, label?: string): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    
    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch (parseError) {
    console.warn(`Failed to parse ${label || key} from localStorage (key: ${key}):`, parseError);
    return defaultValue;
  }
}

/**
 * JSONオブジェクトをlocalStorageへ安全に保存
 */
export function safeSetJson<T>(key: string, value: T, label?: string): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to save ${label || key} to localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * localStorageから文字列値を安全に取得
 */
export function safeGetString(key: string, defaultValue = ''): string {
  try {
    const value = localStorage.getItem(key);
    return value ?? defaultValue;
  } catch (error) {
    console.warn(`Failed to get string from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}

/**
 * 文字列値をlocalStorageへ安全に保存
 */
export function safeSetString(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set string to localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * localStorageからboolean値を安全に取得
 */
export function safeGetBoolean(key: string, defaultValue = false): boolean {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return value === 'true';
  } catch (error) {
    console.warn(`Failed to get boolean from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}

/**
 * boolean値をlocalStorageへ安全に保存
 */
export function safeSetBoolean(key: string, value: boolean): boolean {
  try {
    localStorage.setItem(key, String(value));
    return true;
  } catch (error) {
    console.warn(`Failed to set boolean to localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * localStorageから数値を安全に取得
 */
export function safeGetNumber(key: string, defaultValue = 0): number {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  } catch (error) {
    console.warn(`Failed to get number from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}

/**
 * 数値をlocalStorageへ安全に保存
 */
export function safeSetNumber(key: string, value: number): boolean {
  try {
    localStorage.setItem(key, String(value));
    return true;
  } catch (error) {
    console.warn(`Failed to set number to localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * localStorageから安全にアイテムを削除
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove item from localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * 後方互換性のあるsafeLoadJson（元のutils.tsの引数順序に合わせて）
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
 * 後方互換性のあるsafeSaveJson（元のutils.tsの引数順序に合わせて）
 */
export function safeSaveJson(key: string, value: unknown, label = 'data'): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${label} to localStorage (key: ${key}):`, e);
  }
}

/**
 * localStorage操作の統合ユーティリティオブジェクト
 */
export const localStorageUtils = {
  // JSON操作
  getJson: safeGetJson,
  setJson: safeSetJson,
  
  // 基本型操作
  getString: safeGetString,
  setString: safeSetString,
  getBoolean: safeGetBoolean,
  setBoolean: safeSetBoolean,
  getNumber: safeGetNumber,
  setNumber: safeSetNumber,
  
  // 削除操作
  removeItem: safeRemoveItem,
  
  // 後方互換性
  safeLoadJson,
  safeSaveJson
}; 