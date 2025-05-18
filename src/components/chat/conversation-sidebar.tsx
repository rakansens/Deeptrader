"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface Conversation {
  id: string;
  title: string;
}

export interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  className?: string;
  footer?: ReactNode;
}

export function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  className,
  footer,
}: ConversationSidebarProps) {
  return (
    <aside className={cn("w-56 border-r h-full flex flex-col", className)}>
      <ul className="flex-1 overflow-y-auto p-2 space-y-2">
        {conversations.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md hover:bg-accent/50 transition-colors",
                selectedId === c.id && "bg-accent",
              )}
            >
              {c.title}
            </button>
          </li>
        ))}
      </ul>
      {footer && <div className="p-2 border-t">{footer}</div>}
    </aside>
  );
}

export default ConversationSidebar;
