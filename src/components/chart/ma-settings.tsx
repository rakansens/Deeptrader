'use client'

import { TrendingUp } from 'lucide-react'
import { DEFAULT_INDICATOR_SETTINGS, type IndicatorSettings } from '@/constants/chart'
import IndicatorWidthControl from './indicator-width-control'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface MaSettingsProps {
  settings: IndicatorSettings
  onChange: (s: IndicatorSettings) => void
}

export default function MaSettings({ settings, onChange }: MaSettingsProps) {
  const handlePeriodChange = (value: number) => {
    onChange({
      ...settings,
      sma: value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            期間 (SMA)
          </Label>
          <div className="flex items-center">
            <Input
              type="number"
              className="w-16 h-8 text-sm"
              value={settings.sma}
              min={1}
              max={200}
              onChange={(e) => handlePeriodChange(Number(e.target.value))}
            />
          </div>
        </div>
        <Slider
          value={[settings.sma]}
          min={1}
          max={50}
          step={1}
          onValueChange={(values) => handlePeriodChange(values[0])}
          className="py-2"
        />
      </div>

      <div className="pt-3 border-t">
        <IndicatorWidthControl
          label="線の太さとカラー"
          width={settings.lineWidth.ma}
          color={(settings.colors?.ma ?? DEFAULT_INDICATOR_SETTINGS.colors!.ma) as string}
          onWidthChange={(w) =>
            onChange({
              ...settings,
              lineWidth: { ...settings.lineWidth, ma: w },
            })
          }
          onColorChange={(c) =>
            onChange({
              ...settings,
              colors: { ...settings.colors, ma: c },
            })
          }
        />
      </div>
    </div>
  )
}
