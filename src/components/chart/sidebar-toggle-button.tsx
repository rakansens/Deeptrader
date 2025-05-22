"use client";

import { Button } from "@/components/ui/button";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarToggleButtonProps {
  open: boolean;
  onToggle: () => void;
  className?: string;
}

export default function SidebarToggleButton({
  open,
  onToggle,
  className,
}: SidebarToggleButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("w-8 h-8 p-1.5", className)}
      onClick={onToggle}
      title={open ? "サイドバーを非表示" : "サイドバーを表示"}
    >
      {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
    </Button>
  );
}
