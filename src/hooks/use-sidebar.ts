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
  const [sidebarOpen, setSidebarOpen] = useState(initial);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    // 状態が変わった後にリサイズイベントを通知
    window.dispatchEvent(new Event("resize"));
  }, [sidebarOpen]);

  return { sidebarOpen, toggleSidebar };
}

export default useSidebar;
