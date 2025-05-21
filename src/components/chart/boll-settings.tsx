'use client'

import { Waves } from 'lucide-react'
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { DEFAULT_INDICATOR_SETTINGS, type IndicatorSettings } from '@/constants/chart'
import IndicatorWidthControl from './indicator-width-control'

interface BollSettingsProps {
  settings: IndicatorSettings
  onChange: (s: IndicatorSettings) => void
}

export default function BollSettings({ settings, onChange }: BollSettingsProps) {
  return (
    <AccordionItem value="boll-settings">
      <AccordionTrigger onSelect={(e) => e.preventDefault()}>
        <div className="flex items-center justify-between w-full pr-2">
          <span className="flex items-center">
            <Waves className="h-4 w-4 mr-2 text-muted-foreground" />
            Bollinger Bands
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>期間: {settings.boll.period}</span>
            <span>太さ: {settings.lineWidth.boll}px</span>
            <span
              className="w-3 h-3 rounded-full border"
              style={{ backgroundColor: settings.colors?.boll || DEFAULT_INDICATOR_SETTINGS.colors!.boll }}
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
            value={settings.boll.period}
            min={1}
            onChange={(e) =>
              onChange({
                ...settings,
                boll: {
                  ...settings.boll,
                  period: Number(e.target.value),
                },
              })
            }
          />
        </label>
        <IndicatorWidthControl
          label="BOLL Width"
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
      </AccordionContent>
    </AccordionItem>
  )
}
