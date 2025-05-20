"use client";

import { Slider } from "@/components/ui/slider";

interface EraserSizeControlProps {
  size: number;
  onChange: (size: number) => void;
  className?: string;
}

export default function EraserSizeControl({
  size,
  onChange,
  className,
}: EraserSizeControlProps) {
  return (
    <div
      className={`bg-background/90 p-3 rounded-md border border-input flex flex-col gap-2 ${className ?? ""}`}
    >
      <div className="text-xs font-medium text-muted-foreground mb-1">消しゴムサイズ</div>
      <Slider
        value={[size]}
        min={10}
        max={100}
        step={5}
        onValueChange={(values) => onChange(values[0])}
      />
      <div className="text-xs text-right text-muted-foreground mt-1">{size}px</div>
    </div>
  );
}
