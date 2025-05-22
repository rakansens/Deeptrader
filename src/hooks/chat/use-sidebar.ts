"use client";

import { useCallback, useEffect, useState } from "react";

export interface UseSidebar {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

/**
 * サイドバーの表示状態を管理するフック
 */
export function useSidebar(initial = true): UseSidebar {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    // ローカルストレージから状態を読み込む
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return initial;
  });

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const newState = !prev;
      // 状態変更時にlocalStorageに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarOpen', String(newState));
      }
      return newState;
    });
  }, []);

  return { sidebarOpen, toggleSidebar };
}

export default useSidebar;
