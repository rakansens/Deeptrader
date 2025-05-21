"use client";

import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Conversation } from "@/types";

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
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const filtered = useMemo(
    () =>
      conversations.filter((c) =>
        c.title.toLowerCase().includes(filter.toLowerCase()),
      ),
    [conversations, filter],
  );

  const startRename = (id: string, title: string) => {
    setTargetId(id);
    setRenameValue(title);
    setRenameOpen(true);
  };

  const handleRename = () => {
    if (targetId && renameValue.trim()) {
      onRename?.(targetId, renameValue.trim());
    }
    setRenameOpen(false);
    setTargetId(null);
  };
  return (
    <>
      <aside className={cn("w-56 border-r h-full flex flex-col", className)}>
      <div className="p-2 border-b">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="会話を検索..."
        />
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.map((c) => (
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
                onClick={() => startRename(c.id, c.title)}
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
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>会話名を変更</DialogTitle>
            <DialogDescription>新しい会話名を入力してください。</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="新しい会話名"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleRename}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ConversationSidebar;
