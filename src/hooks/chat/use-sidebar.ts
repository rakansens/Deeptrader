"use client";

import { useCallback, useEffect, useState } from "react";
import { safeGetBoolean, safeSetBoolean } from "@/lib/local-storage-utils";

export interface UseSidebar {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

/**
 * サイドバーの表示状態を管理するフック
 */
export function useSidebar(initial = true): UseSidebar {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    // 統一ユーティリティでローカルストレージから状態を読み込む
    if (typeof window !== 'undefined') {
      return safeGetBoolean('sidebarOpen', initial);
    }
    return initial;
  });

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const newState = !prev;
      // 統一ユーティリティで状態変更時にlocalStorageに保存
      if (typeof window !== 'undefined') {
        safeSetBoolean('sidebarOpen', newState);
      }
      return newState;
    });
  }, []);

  return { sidebarOpen, toggleSidebar };
}

export default useSidebar;
