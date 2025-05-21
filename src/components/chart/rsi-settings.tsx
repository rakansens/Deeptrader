'use client'

import { Activity } from 'lucide-react'
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { DEFAULT_INDICATOR_SETTINGS, type IndicatorSettings } from '@/constants/chart'
import IndicatorWidthControl from './indicator-width-control'

interface RsiSettingsProps {
  settings: IndicatorSettings
  onChange: (s: IndicatorSettings) => void
}

export default function RsiSettings({ settings, onChange }: RsiSettingsProps) {
  return (
    <AccordionItem value="rsi-settings">
      <AccordionTrigger onSelect={(e) => e.preventDefault()}>
        <div className="flex items-center justify-between w-full pr-2">
          <span className="flex items-center">
            <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
            RSI
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>期間: {settings.rsi}</span>
            <span>太さ: {settings.lineWidth.rsi}px</span>
            <span
              className="w-3 h-3 rounded-full border"
              style={{ backgroundColor: settings.colors?.rsi || DEFAULT_INDICATOR_SETTINGS.colors!.rsi }}
            ></span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-3 space-y-3 overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:max-h-0 data-[state=closed]:opacity-0 data-[state=open]:max-h-[var(--radix-accordion-content-height)] data-[state=open]:opacity-100">
        <label className="flex items-center justify-between text-sm">
          <span>期間</span>
          <input
            type="number"
            className="w-20 border rounded px-1 py-0.5 bg-background text-sm"
            value={settings.rsi}
            min={1}
            onChange={(e) =>
              onChange({
                ...settings,
                rsi: Number(e.target.value),
              })
            }
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Overbought</span>
          <input
            type="number"
            className="w-20 border rounded px-1 py-0.5 bg-background text-sm"
            value={settings.rsiUpper}
            min={1}
            max={100}
            onChange={(e) =>
              onChange({
                ...settings,
                rsiUpper: Number(e.target.value),
              })
            }
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Oversold</span>
          <input
            type="number"
            className="w-20 border rounded px-1 py-0.5 bg-background text-sm"
            value={settings.rsiLower}
            min={1}
            max={100}
            onChange={(e) =>
              onChange({
                ...settings,
                rsiLower: Number(e.target.value),
              })
            }
          />
        </label>
        <IndicatorWidthControl
          label="RSI Width"
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
      </AccordionContent>
    </AccordionItem>
  )
}
