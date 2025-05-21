'use client'

import { Waves } from 'lucide-react'
import { DEFAULT_INDICATOR_SETTINGS, type IndicatorSettings } from '@/constants/chart'
import IndicatorWidthControl from './indicator-width-control'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface BollSettingsProps {
  settings: IndicatorSettings
  onChange: (s: IndicatorSettings) => void
}

export default function BollSettings({ settings, onChange }: BollSettingsProps) {
  const handlePeriodChange = (value: number) => {
    onChange({
      ...settings,
      boll: {
        ...settings.boll,
        period: value,
      },
    })
  }

  const handleStdDevChange = (value: number) => {
    onChange({
      ...settings,
      boll: {
        ...settings.boll,
        stdDev: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            期間
          </Label>
          <div className="flex items-center">
            <Input
              type="number"
              className="w-16 h-8 text-sm"
              value={settings.boll.period}
              min={1}
              max={100}
              onChange={(e) => handlePeriodChange(Number(e.target.value))}
            />
          </div>
        </div>
        <Slider
          value={[settings.boll.period]}
          min={5}
          max={50}
          step={1}
          onValueChange={(values) => handlePeriodChange(values[0])}
          className="py-2"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            標準偏差
          </Label>
          <div className="flex items-center">
            <Input
              type="number"
              className="w-16 h-8 text-sm"
              value={settings.boll.stdDev || 2}
              min={0.5}
              max={5}
              step={0.1}
              onChange={(e) => handleStdDevChange(Number(e.target.value))}
            />
          </div>
        </div>
        <Slider
          value={[settings.boll.stdDev || 2]}
          min={0.5}
          max={5}
          step={0.1}
          onValueChange={(values) => handleStdDevChange(values[0])}
          className="py-2"
        />
      </div>

      <div className="pt-3 border-t">
        <IndicatorWidthControl
          label="線の太さとカラー"
          width={settings.lineWidth.boll}
          color={(settings.colors?.boll ?? DEFAULT_INDICATOR_SETTINGS.colors!.boll) as string}
          onWidthChange={(w) =>
            onChange({
              ...settings,
              lineWidth: { ...settings.lineWidth, boll: w },
            })
          }
          onColorChange={(c) =>
            onChange({
              ...settings,
              colors: { ...settings.colors, boll: c },
            })
          }
        />
      </div>
    </div>
  )
}
