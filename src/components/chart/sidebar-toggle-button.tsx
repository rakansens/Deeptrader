"use client";

import { Button } from "@/components/ui/button";
import { PanelLeft, PanelLeftClose } from "lucide-react";

interface SidebarToggleButtonProps {
  open: boolean;
  onToggle: () => void;
}

export default function SidebarToggleButton({
  open,
  onToggle,
}: SidebarToggleButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="absolute top-2 left-2 z-30 w-8 h-8 p-1.5"
      onClick={onToggle}
      title={open ? "サイドバーを非表示" : "サイドバーを表示"}
    >
      {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
    </Button>
  );
}
