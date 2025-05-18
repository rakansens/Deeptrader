"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface MessageBubbleProps {
  role: "user" | "assistant";
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
      <div
        className={cn("text-sm whitespace-pre-wrap", typing && "animate-pulse")}
      >
        {children}
      </div>
    </div>
  );
}

export default MessageBubble;
