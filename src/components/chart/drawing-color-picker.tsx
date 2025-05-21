"use client";

import { DRAWING_COLORS } from "@/constants/chart";

export interface DrawingColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// デバッグ用の固定カラー配列
const DEFAULT_COLORS = [
  { label: '赤', value: '#FF0000' },
  { label: '青', value: '#0000FF' },
  { label: '緑', value: '#00FF00' },
  { label: '黄', value: '#FFFF00' },
  { label: '黒', value: '#000000' },
  { label: '白', value: '#FFFFFF' },
];

/** 描画色を選択するボタン群 */
export default function DrawingColorPicker({
  value,
  onChange,
  className,
}: DrawingColorPickerProps) {
  // デバッグ用に固定配列を使用
  const colorsToUse = DEFAULT_COLORS;
  
  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ""}`.trim()}>
      {colorsToUse.map((c) => (
        <button
          key={c.value}
          title={c.label}
          onClick={() => onChange(c.value)}
          className={`w-6 h-6 rounded-full border border-border transition-all ${
            value === c.value
              ? "ring-2 ring-offset-1 ring-primary"
              : "opacity-70 hover:opacity-100"
          }`}
          style={{ backgroundColor: c.value }}
          aria-label={`色を${c.label}に変更`}
          data-testid={`color-${c.label}`}
        />
      ))}
    </div>
  );
}

