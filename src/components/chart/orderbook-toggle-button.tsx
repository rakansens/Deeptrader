"use client";

import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface OrderBookToggleButtonProps {
  onToggle: () => void;
  className?: string;
}

export default function OrderBookToggleButton({ 
  onToggle, 
  className 
}: OrderBookToggleButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={`absolute top-2 right-2 z-30 w-8 h-8 p-1.5 ${className || ''}`}
      onClick={onToggle}
      title="OrderBookを表示"
      aria-label="Show OrderBook"
    >
      <Eye className="h-4 w-4" />
    </Button>
  );
}
