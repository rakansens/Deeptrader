'use client'

interface IndicatorWidthControlProps {
  label: string
  width: number
  color: string
  onWidthChange: (w: number) => void
  onColorChange: (c: string) => void
}

export default function IndicatorWidthControl({
  label,
  width,
  color,
  onWidthChange,
  onColorChange,
}: IndicatorWidthControlProps) {
  return (
    <div className="pt-2 border-t border-border/50">
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          <span>{width}px</span>
          <input
            type="color"
            value={color}
            className="w-6 h-6 p-0.5 border rounded cursor-pointer bg-background"
            onChange={(e) => onColorChange(e.target.value)}
          />
        </div>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={width}
        aria-label={label}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        onChange={(e) => onWidthChange(Number(e.target.value))}
      />
      <div className="mt-1 h-5 w-full bg-muted/30 dark:bg-muted/20 rounded flex items-center justify-center overflow-hidden p-[2px]">
        <div
          style={{
            height: `${width}px`,
            width: '100%',
            backgroundColor: color,
            borderRadius: '2px',
          }}
        ></div>
      </div>
    </div>
  )
}
