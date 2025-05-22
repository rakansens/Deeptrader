'use client'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{width}px</span>
          <div className="relative">
            <input
              type="color"
              value={color}
              className="w-8 h-8 rounded-full border cursor-pointer opacity-0 absolute inset-0"
              onChange={(e) => {
                console.log('色を変更:', e.target.value);
                onColorChange(e.target.value);
              }}
            />
            <div 
              className="w-8 h-8 rounded-full border-2 border-muted flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: color }}
            >
              <div className="absolute inset-0 rounded-full shadow-inner"></div>
            </div>
          </div>
        </div>
      </div>
      <Slider
        value={[width]}
        min={1}
        max={10}
        step={1}
        onValueChange={(values) => onWidthChange(values[0])}
        className="py-2"
      />
      <div className="h-10 w-full bg-background border rounded-md flex items-center justify-center overflow-hidden p-1">
        <div
          style={{
            height: `${width}px`,
            width: '100%',
            backgroundColor: color,
            borderRadius: '2px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        ></div>
      </div>
    </div>
  )
}
