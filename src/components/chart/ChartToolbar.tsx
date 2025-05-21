'use client'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { ListPlus, TrendingUp, Activity, BarChart3, Waves, Settings } from 'lucide-react'
import { Accordion } from '@/components/ui/accordion'
import type { IndicatorOptions, IndicatorsChangeHandler } from '@/types/chart'
import {
  TIMEFRAMES,
  SYMBOLS,
  type Timeframe,
  type SymbolValue,
} from '@/constants/chart'
import type { IndicatorSettings } from '@/constants/chart'
import MaSettings from './ma-settings'
import RsiSettings from './rsi-settings'
import MacdSettings from './macd-settings'
import BollSettings from './boll-settings'
import IndicatorSettingsModal from './IndicatorSettingsModal'

interface ChartToolbarProps {
  timeframe: Timeframe
  onTimeframeChange: (timeframe: Timeframe) => void
  symbol?: SymbolValue
  onSymbolChange?: (symbol: SymbolValue) => void
  indicators: IndicatorOptions
  onIndicatorsChange: IndicatorsChangeHandler
  settings: IndicatorSettings
  onSettingsChange: (s: IndicatorSettings) => void
}

type IndicatorKey = keyof IndicatorOptions

const INDICATOR_ITEMS: { key: IndicatorKey; label: string; icon: React.ComponentType<{className?: string}>; testId?: string }[] = [
  { key: 'ma', label: '移動平均線 (MA)', icon: TrendingUp },
  { key: 'rsi', label: 'RSI', icon: Activity, testId: 'checkbox-rsi' },
  { key: 'macd', label: 'MACD', icon: BarChart3, testId: 'checkbox-macd' },
  { key: 'boll', label: 'Bollinger Bands', icon: Waves },
]

export default function ChartToolbar({
  timeframe,
  onTimeframeChange,
  symbol = SYMBOLS[0].value,
  onSymbolChange,
  indicators,
  onIndicatorsChange,
  settings,
  onSettingsChange,
}: ChartToolbarProps) {
  return (
    <div
      data-testid="chart-toolbar"
      className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between bg-background border-b"
    >
      <div className="flex gap-4 items-center">
        {onSymbolChange && (
          <div className="flex-wrap md:flex-nowrap">
            <Select value={symbol} onValueChange={(v) => v && onSymbolChange(v as SymbolValue)}>
              <SelectTrigger className="w-[8.5rem]" data-testid="symbol-trigger" aria-label="Symbol">
                <SelectValue>{SYMBOLS.find((s) => s.value === symbol)?.label || symbol}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map((s) => (
                  <SelectItem key={s.value} value={s.value} aria-label={`Symbol ${s.label}`}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex-wrap md:flex-nowrap">
          <Select value={timeframe} onValueChange={(v) => v && onTimeframeChange(v as Timeframe)}>
            <SelectTrigger className="w-[8.5rem]" data-testid="timeframe-trigger" aria-label="Timeframe">
              <SelectValue>{timeframe}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((tf) => (
                <SelectItem key={tf} value={tf} aria-label={`Timeframe ${tf}`}>
                  {tf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <ListPlus className="h-4 w-4 mr-2" />
                インジケーター
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
              <DropdownMenuLabel>表示する指標</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {INDICATOR_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuCheckboxItem
                    key={item.key}
                    checked={!!indicators[item.key]}
                    onCheckedChange={(checked) =>
                      onIndicatorsChange({ ...indicators, [item.key]: checked } as IndicatorOptions)
                    }
                    onSelect={(e) => e.preventDefault()}
                    data-testid={item.testId}
                  >
                    <Icon className="h-4 w-4 mr-2 opacity-70" />
                    {item.label}
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:flex items-center gap-1.5 text-muted-foreground ml-2">
            {INDICATOR_ITEMS.map((item) => {
              const Icon = item.icon
              return indicators[item.key] ? <Icon key={item.key} className="h-3.5 w-3.5" /> : null
            })}
          </div>
        </div>

        <ThemeToggle />
        <IndicatorSettingsModal settings={settings} onSettingsChange={onSettingsChange} />
      </div>
    </div>
  )
}
