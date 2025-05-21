'use client'

import { TrendingUp } from 'lucide-react'
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { DEFAULT_INDICATOR_SETTINGS, type IndicatorSettings } from '@/constants/chart'
import IndicatorWidthControl from './indicator-width-control'

interface MaSettingsProps {
  settings: IndicatorSettings
  onChange: (s: IndicatorSettings) => void
}

export default function MaSettings({ settings, onChange }: MaSettingsProps) {
  return (
    <AccordionItem value="ma-settings">
      <AccordionTrigger onSelect={(e) => e.preventDefault()}>
        <div className="flex items-center justify-between w-full pr-2">
          <span className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
            移動平均線 (MA)
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>期間: {settings.sma}</span>
            <span>太さ: {settings.lineWidth.ma}px</span>
            <span
              className="w-3 h-3 rounded-full border"
              style={{ backgroundColor: settings.colors?.ma || DEFAULT_INDICATOR_SETTINGS.colors!.ma }}
            ></span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-3 space-y-3 overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:max-h-0 data-[state=closed]:opacity-0 data-[state=open]:max-h-[var(--radix-accordion-content-height)] data-[state=open]:opacity-100">
        <label className="flex items-center justify-between text-sm">
          <span>期間 (SMA)</span>
          <input
            type="number"
            className="w-20 border rounded px-1 py-0.5 bg-background text-sm"
            value={settings.sma}
            min={1}
            onChange={(e) =>
              onChange({
                ...settings,
                sma: Number(e.target.value),
              })
            }
          />
        </label>
        <IndicatorWidthControl
          label="MA Width"
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
      </AccordionContent>
    </AccordionItem>
  )
}
