"use client";

import { useCallback, useState } from "react";

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

  return { sidebarOpen, toggleSidebar };
}

export default useSidebar;
