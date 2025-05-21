'use client'

import { BarChart3 } from 'lucide-react'
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { DEFAULT_INDICATOR_SETTINGS, type IndicatorSettings } from '@/constants/chart'
import IndicatorWidthControl from './indicator-width-control'

interface MacdSettingsProps {
  settings: IndicatorSettings
  onChange: (s: IndicatorSettings) => void
}

export default function MacdSettings({ settings, onChange }: MacdSettingsProps) {
  return (
    <AccordionItem value="macd-settings">
      <AccordionTrigger onSelect={(e) => e.preventDefault()}>
        <div className="flex items-center justify-between w-full pr-2">
          <span className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" />
            MACD
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>S:{settings.macd.short} L:{settings.macd.long} Si:{settings.macd.signal}</span>
            <span>太さ: {settings.lineWidth.macd}px</span>
            <span
              className="w-3 h-3 rounded-full border"
              style={{ backgroundColor: settings.colors?.macd || DEFAULT_INDICATOR_SETTINGS.colors!.macd }}
            ></span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-3 space-y-3 overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:max-h-0 data-[state=closed]:opacity-0 data-[state=open]:max-h-[var(--radix-accordion-content-height)] data-[state=open]:opacity-100">
        <label className="flex items-center justify-between text-sm">
          <span>Short</span>
          <input
            type="number"
            className="w-20 border rounded px-1 py-0.5 bg-background text-sm"
            value={settings.macd.short}
            min={1}
            onChange={(e) =>
              onChange({
                ...settings,
                macd: {
                  ...settings.macd,
                  short: Number(e.target.value),
                },
              })
            }
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Long</span>
          <input
            type="number"
            className="w-20 border rounded px-1 py-0.5 bg-background text-sm"
            value={settings.macd.long}
            min={1}
            onChange={(e) =>
              onChange({
                ...settings,
                macd: {
                  ...settings.macd,
                  long: Number(e.target.value),
                },
              })
            }
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Signal</span>
          <input
            type="number"
            className="w-20 border rounded px-1 py-0.5 bg-background text-sm"
            value={settings.macd.signal}
            min={1}
            onChange={(e) =>
              onChange({
                ...settings,
                macd: {
                  ...settings.macd,
                  signal: Number(e.target.value),
                },
              })
            }
          />
        </label>
        <IndicatorWidthControl
          label="MACD Width"
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
      </AccordionContent>
    </AccordionItem>
  )
}
