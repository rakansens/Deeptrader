"use client";

import { cn } from "@/lib/utils";
import TypingIndicator from "./typing-indicator";
import { Copy } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { ReactNode } from "react";
import type { ChatRole } from "@/types";

export interface MessageBubbleProps {
  role: ChatRole;
  children: ReactNode;
  className?: string;
  /** アシスタントが入力中であることを示す */
  typing?: boolean;
  /** UNIXタイムスタンプ */
  timestamp?: number;
  /** アバター画像URLまたはアイコン要素 */
  avatar?: string | ReactNode;
}

export function MessageBubble({
  role,
  children,
  className,
  typing = false,
  timestamp,
  avatar,
}: MessageBubbleProps) {
  const handleCopy = () => {
    if (typeof children !== "string" || typing) return;
    try {
      void navigator.clipboard.writeText(children);
    } catch {
      // ignore clipboard errors
    }
  };
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
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {avatar ? (
          typeof avatar === "string" ? (
            <Avatar className="h-5 w-5">
              <AvatarImage src={avatar} />
              <AvatarFallback>{role === "user" ? "U" : "AI"}</AvatarFallback>
            </Avatar>
          ) : (
            avatar
          )
        ) : null}
        <span className="font-medium">
          {role === "user" ? "あなた" : "DeepTrader AI"}
        </span>
        {timestamp !== undefined && (
          <span className="ml-auto">
            {new Date(timestamp).toLocaleString()}
          </span>
        )}
        {typeof children === "string" && !typing && (
          <button
            type="button"
            aria-label="コピー"
            onClick={handleCopy}
            className="p-1 hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
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
