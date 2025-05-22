'use client'

import { TrendingUp } from 'lucide-react'
import { DEFAULT_INDICATOR_SETTINGS, type IndicatorSettings } from '@/constants/chart'
import IndicatorWidthControl from './indicator-width-control'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

interface MaSettingsProps {
  settings: IndicatorSettings
  onChange: (s: IndicatorSettings) => void
}

export default function MaSettings({ settings, onChange }: MaSettingsProps) {
  // MA1（短期）の変更ハンドラ
  const handleMA1Change = (value: number) => {
    onChange({
      ...settings,
      ma: {
        ...settings.ma,
        ma1: value,
      },
    });
  };

  // MA2（中期）の変更ハンドラ
  const handleMA2Change = (value: number) => {
    onChange({
      ...settings,
      ma: {
        ...settings.ma,
        ma2: value,
      },
    });
  };

  // MA3（長期）の変更ハンドラ
  const handleMA3Change = (value: number) => {
    onChange({
      ...settings,
      ma: {
        ...settings.ma,
        ma3: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* MA1（短期）設定 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            短期MA (MA1)
          </Label>
          <div className="flex items-center">
            <Input
              type="number"
              className="w-16 h-8 text-sm"
              value={settings.ma.ma1}
              min={1}
              max={200}
              onChange={(e) => handleMA1Change(Number(e.target.value))}
            />
          </div>
        </div>
        <Slider
          value={[settings.ma.ma1]}
          min={1}
          max={50}
          step={1}
          onValueChange={(values) => handleMA1Change(values[0])}
          className="py-2"
        />
        <IndicatorWidthControl
          label="MA1 カラー"
          width={settings.lineWidth.ma1 ?? settings.lineWidth.ma}
          color={(settings.colors?.ma1 ?? DEFAULT_INDICATOR_SETTINGS.colors!.ma1) as string}
          onWidthChange={(w) =>
            onChange({
              ...settings,
              lineWidth: { ...settings.lineWidth, ma1: w, ma: w },
            })
          }
          onColorChange={(c) =>
            onChange({
              ...settings,
              colors: { ...settings.colors, ma1: c },
            })
          }
        />
      </div>

      <Separator className="my-2" />

      {/* MA2（中期）設定 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            中期MA (MA2)
          </Label>
          <div className="flex items-center">
            <Input
              type="number"
              className="w-16 h-8 text-sm"
              value={settings.ma.ma2}
              min={1}
              max={200}
              onChange={(e) => handleMA2Change(Number(e.target.value))}
            />
          </div>
        </div>
        <Slider
          value={[settings.ma.ma2]}
          min={5}
          max={100}
          step={1}
          onValueChange={(values) => handleMA2Change(values[0])}
          className="py-2"
        />
        <IndicatorWidthControl
          label="MA2 カラー"
          width={settings.lineWidth.ma2 ?? settings.lineWidth.ma}
          color={(settings.colors?.ma2 ?? DEFAULT_INDICATOR_SETTINGS.colors!.ma2) as string}
          onWidthChange={(w) =>
            onChange({
              ...settings,
              lineWidth: { ...settings.lineWidth, ma2: w },
            })
          }
          onColorChange={(c) =>
            onChange({
              ...settings,
              colors: { ...settings.colors, ma2: c },
            })
          }
        />
      </div>

      <Separator className="my-2" />

      {/* MA3（長期）設定 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            長期MA (MA3)
          </Label>
          <div className="flex items-center">
            <Input
              type="number"
              className="w-16 h-8 text-sm"
              value={settings.ma.ma3}
              min={1}
              max={500}
              onChange={(e) => handleMA3Change(Number(e.target.value))}
            />
          </div>
        </div>
        <Slider
          value={[settings.ma.ma3]}
          min={10}
          max={200}
          step={1}
          onValueChange={(values) => handleMA3Change(values[0])}
          className="py-2"
        />
        <IndicatorWidthControl
          label="MA3 カラー"
          width={settings.lineWidth.ma3 ?? settings.lineWidth.ma}
          color={(settings.colors?.ma3 ?? DEFAULT_INDICATOR_SETTINGS.colors!.ma3) as string}
          onWidthChange={(w) =>
            onChange({
              ...settings,
              lineWidth: { ...settings.lineWidth, ma3: w },
            })
          }
          onColorChange={(c) =>
            onChange({
              ...settings,
              colors: { ...settings.colors, ma3: c },
            })
          }
        />
      </div>

      <div className="pt-3 border-t">
        <div className="text-xs text-muted-foreground">
          ヒント: MA1は7日、MA2は25日、MA3は99日など、異なる期間を設定するとトレンドの変化が分かりやすくなります。
        </div>
      </div>
    </div>
  )
}
