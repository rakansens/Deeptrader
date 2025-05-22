"use client";

import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface OrderBookToggleButtonProps {
  onToggle: () => void;
  className?: string;
  active?: boolean;
}

export default function OrderBookToggleButton({ 
  onToggle, 
  className,
  active = false
}: OrderBookToggleButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`p-1 h-7 ${active ? "bg-muted" : ""} ${className || ''}`}
      onClick={onToggle}
      title="オーダーブック"
      aria-label="Toggle OrderBook"
    >
      <BookOpen className="h-3.5 w-3.5" />
    </Button>
  );
}
