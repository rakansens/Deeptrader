'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface ChartToolbarProps {
  timeframe: string
  onTimeframeChange: (timeframe: string) => void
  indicators: {
    ma: boolean
    rsi: boolean
  }
  onIndicatorsChange: (value: { ma: boolean; rsi: boolean }) => void
}

const TIMEFRAMES = ['1m', '5m', '1h', '1d']

export default function ChartToolbar({
  timeframe,
  onTimeframeChange,
  indicators,
  onIndicatorsChange,
}: ChartToolbarProps) {
  return (
    <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
      <ToggleGroup
        type="single"
        value={timeframe}
        onValueChange={(v) => v && onTimeframeChange(v)}
      >
        {TIMEFRAMES.map((tf) => (
          <ToggleGroupItem key={tf} value={tf} aria-label={`Timeframe ${tf}`}>
            {tf}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="ma-toggle"
            checked={indicators.ma}
            onCheckedChange={(v) => onIndicatorsChange({ ...indicators, ma: v })}
          />
          <Label htmlFor="ma-toggle">MA</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="rsi-toggle"
            checked={indicators.rsi}
            onCheckedChange={(v) => onIndicatorsChange({ ...indicators, rsi: v })}
          />
          <Label htmlFor="rsi-toggle">RSI</Label>
        </div>
        <ThemeToggle />
      </div>
    </div>
  )
}
