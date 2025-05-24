import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// localStorage統一ユーティリティからの後方互換エクスポート - Phase 6A-6統合
export { 
  safeLoadJson,
  safeSaveJson,
  localStorageUtils
} from './local-storage-utils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
