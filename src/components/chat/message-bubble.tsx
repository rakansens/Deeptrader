"use client";

import { cn } from "@/lib/utils";
import TypingIndicator from "./typing-indicator";
import type { ReactNode } from "react";
import type { ChatRole } from "@/types/chat";

export interface MessageBubbleProps {
  role: ChatRole;
  children: ReactNode;
  className?: string;
  /** アシスタントが入力中であることを示す */
  typing?: boolean;
}

export function MessageBubble({
  role,
  children,
  className,
  typing = false,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-md space-y-1 animate-in fade-in-0",
        role === "user"
          ? "bg-primary/10 border-l-4 border-primary ml-4"
          : "bg-muted/50",
        className,
      )}
    >
      <p className="text-sm font-medium">
        {role === "user" ? "あなた" : "DeepTrader AI"}
      </p>
      <div className="text-sm whitespace-pre-wrap">
        {typing ? (
          <div className="flex items-center gap-2">
            <TypingIndicator />
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
