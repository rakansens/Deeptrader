'use client'

import { Activity } from 'lucide-react'
import { DEFAULT_INDICATOR_SETTINGS, type IndicatorSettings } from '@/constants/chart'
import IndicatorWidthControl from './indicator-width-control'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface RsiSettingsProps {
  settings: IndicatorSettings
  onChange: (s: IndicatorSettings) => void
}

export default function RsiSettings({ settings, onChange }: RsiSettingsProps) {
  const handlePeriodChange = (value: number) => {
    onChange({
      ...settings,
      rsi: value,
    })
  }

  const handleUpperChange = (value: number) => {
    onChange({
      ...settings,
      rsiUpper: value,
    })
  }

  const handleLowerChange = (value: number) => {
    onChange({
      ...settings,
      rsiLower: value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            RSI 期間
          </Label>
          <div className="flex items-center">
            <Input
              type="number"
              className="w-16 h-8 text-sm"
              value={settings.rsi}
              min={1}
              max={100}
              onChange={(e) => handlePeriodChange(Number(e.target.value))}
            />
          </div>
        </div>
        <Slider
          value={[settings.rsi]}
          min={1}
          max={30}
          step={1}
          onValueChange={(values) => handlePeriodChange(values[0])}
          className="py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              買われすぎ
            </Label>
            <Input
              type="number"
              className="w-16 h-8 text-sm"
              value={settings.rsiUpper}
              min={50}
              max={100}
              onChange={(e) => handleUpperChange(Number(e.target.value))}
            />
          </div>
          <Slider
            value={[settings.rsiUpper]}
            min={50}
            max={90}
            step={1}
            onValueChange={(values) => handleUpperChange(values[0])}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              売られすぎ
            </Label>
            <Input
              type="number"
              className="w-16 h-8 text-sm"
              value={settings.rsiLower}
              min={10}
              max={50}
              onChange={(e) => handleLowerChange(Number(e.target.value))}
            />
          </div>
          <Slider
            value={[settings.rsiLower]}
            min={10}
            max={50}
            step={1}
            onValueChange={(values) => handleLowerChange(values[0])}
          />
        </div>
      </div>

      <div className="pt-3 border-t">
        <IndicatorWidthControl
          label="線の太さとカラー"
          width={settings.lineWidth.rsi}
          color={(settings.colors?.rsi ?? DEFAULT_INDICATOR_SETTINGS.colors!.rsi) as string}
          onWidthChange={(w) =>
            onChange({
              ...settings,
              lineWidth: { ...settings.lineWidth, rsi: w },
            })
          }
          onColorChange={(c) =>
            onChange({
              ...settings,
              colors: { ...settings.colors, rsi: c },
            })
          }
        />
      </div>
    </div>
  )
}
