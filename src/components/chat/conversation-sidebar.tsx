"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { PenLine, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { Conversation } from "@/types/chat";

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onRemove?: (id: string) => void;
  className?: string;
  footer?: ReactNode;
}

export function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  onRename,
  onRemove,
  className,
  footer,
}: ConversationSidebarProps) {
  return (
    <aside className={cn("w-56 border-r h-full flex flex-col", className)}>
      <ul className="flex-1 overflow-y-auto p-2 space-y-2">
        {conversations.map((c) => (
          <li key={c.id} className="flex items-center group">
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className={cn(
                "flex-1 text-left px-3 py-2 rounded-md hover:bg-accent/50 transition-colors",
                selectedId === c.id && "bg-accent",
              )}
            >
              {c.title}
            </button>
            {onRename && (
              <button
                type="button"
                aria-label="rename"
                className="ml-1 p-1 opacity-0 group-hover:opacity-100"
                onClick={() => {
                  const title = window.prompt("新しい会話名", c.title);
                  if (title && title.trim()) {
                    onRename(c.id, title.trim());
                  }
                }}
              >
                <PenLine className="w-3 h-3" />
              </button>
            )}
            {onRemove && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    aria-label="delete"
                    className="ml-1 p-1 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>この会話を削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この操作は取り消せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onRemove(c.id)}>
                      削除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </li>
        ))}
      </ul>
      {footer && <div className="p-2 border-t">{footer}</div>}
    </aside>
  );
}

export default ConversationSidebar;
