'use client'

import { BarChart3 } from 'lucide-react'
import { DEFAULT_INDICATOR_SETTINGS, type IndicatorSettings } from '@/constants/chart'
import IndicatorWidthControl from './indicator-width-control'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface MacdSettingsProps {
  settings: IndicatorSettings
  onChange: (s: IndicatorSettings) => void
}

export default function MacdSettings({ settings, onChange }: MacdSettingsProps) {
  const handleShortChange = (value: number) => {
    onChange({
      ...settings,
      macd: {
        ...settings.macd,
        short: value,
      },
    })
  }

  const handleLongChange = (value: number) => {
    onChange({
      ...settings,
      macd: {
        ...settings.macd,
        long: value,
      },
    })
  }

  const handleSignalChange = (value: number) => {
    onChange({
      ...settings,
      macd: {
        ...settings.macd,
        signal: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              短期線
            </Label>
            <div className="flex items-center">
              <Input
                type="number"
                className="w-16 h-8 text-sm"
                value={settings.macd.short}
                min={1}
                max={100}
                onChange={(e) => handleShortChange(Number(e.target.value))}
              />
            </div>
          </div>
          <Slider
            value={[settings.macd.short]}
            min={1}
            max={30}
            step={1}
            onValueChange={(values) => handleShortChange(values[0])}
            className="py-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              長期線
            </Label>
            <div className="flex items-center">
              <Input
                type="number"
                className="w-16 h-8 text-sm"
                value={settings.macd.long}
                min={1}
                max={200}
                onChange={(e) => handleLongChange(Number(e.target.value))}
              />
            </div>
          </div>
          <Slider
            value={[settings.macd.long]}
            min={5}
            max={50}
            step={1}
            onValueChange={(values) => handleLongChange(values[0])}
            className="py-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              シグナル線
            </Label>
            <div className="flex items-center">
              <Input
                type="number"
                className="w-16 h-8 text-sm"
                value={settings.macd.signal}
                min={1}
                max={50}
                onChange={(e) => handleSignalChange(Number(e.target.value))}
              />
            </div>
          </div>
          <Slider
            value={[settings.macd.signal]}
            min={1}
            max={20}
            step={1}
            onValueChange={(values) => handleSignalChange(values[0])}
            className="py-2"
          />
        </div>
      </div>

      <div className="pt-3 border-t">
        <IndicatorWidthControl
          label="線の太さとカラー"
          width={settings.lineWidth.macd}
          color={(settings.colors?.macd ?? DEFAULT_INDICATOR_SETTINGS.colors!.macd) as string}
          onWidthChange={(w) =>
            onChange({
              ...settings,
              lineWidth: { ...settings.lineWidth, macd: w },
            })
          }
          onColorChange={(c) =>
            onChange({
              ...settings,
              colors: { ...settings.colors, macd: c },
            })
          }
        />
      </div>
    </div>
  )
}
