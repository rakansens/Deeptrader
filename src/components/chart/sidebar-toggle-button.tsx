"use client";

import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
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
      title={open ? "描画ツールを非表示" : "描画ツールを表示"}
    >
      <Wrench className={cn("h-4 w-4", open && "text-primary")} />
    </Button>
  );
}
