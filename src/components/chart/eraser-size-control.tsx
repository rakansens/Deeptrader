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
      className={`bg-background/90 p-2 rounded-md border border-input/80 flex flex-col gap-1.5 ${className ?? ""}`}
    >
      <div className="text-xs font-medium text-muted-foreground">消しゴムサイズ</div>
      <Slider
        value={[size]}
        min={10}
        max={100}
        step={5}
        onValueChange={(values) => onChange(values[0])}
        className="h-3"
      />
      <div className="text-[10px] text-right text-muted-foreground">{size}px</div>
    </div>
  );
}
