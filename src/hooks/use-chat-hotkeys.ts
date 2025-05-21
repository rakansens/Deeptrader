"use client";

import { useEffect } from "react";

interface UseChatHotkeysOptions {
  onScreenshot: () => void;
  onToggleSidebar: () => void;
  onToggleVoice: () => void;
}

/**
 * チャット画面のキーボードショートカットを管理するフック
 */
export function useChatHotkeys({
  onScreenshot,
  onToggleSidebar,
  onToggleVoice,
}: UseChatHotkeysOptions) {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }
      const key = e.key.toLowerCase();
      if (e.ctrlKey && e.shiftKey && key === "s") {
        e.preventDefault();
        onScreenshot();
      }
      if (e.ctrlKey && key === "b") {
        e.preventDefault();
        onToggleSidebar();
      }
      if (e.ctrlKey && key === "m") {
        e.preventDefault();
        onToggleVoice();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onScreenshot, onToggleSidebar, onToggleVoice]);
}

export default useChatHotkeys;
