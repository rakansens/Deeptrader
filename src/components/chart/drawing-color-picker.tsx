"use client";

import { DRAWING_COLORS } from "@/constants/chart";

export interface DrawingColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** 描画色を選択するボタン群 */
export default function DrawingColorPicker({
  value,
  onChange,
  className,
}: DrawingColorPickerProps) {
  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ""}`.trim()}>
      {DRAWING_COLORS.map((c) => (
        <button
          key={c.value}
          title={c.label}
          onClick={() => onChange(c.value)}
          className={`w-6 h-6 rounded-full border border-border transition-all ${
            value === c.value
              ? "ring-2 ring-offset-1 ring-primary"
              : "opacity-70 hover:opacity-100"
          } ${c.class}`}
          aria-label={`色を${c.label}に変更`}
          data-testid={`color-${c.label}`}
        />
      ))}
    </div>
  );
}

