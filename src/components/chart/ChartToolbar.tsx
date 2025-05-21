'use client'

/**
 * インジケーターの線幅設定UIをスライダーとリアルタイムプレビューに変更。
 */

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ListPlus, TrendingUp, Activity, BarChart3, Waves, Settings } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type {
  IndicatorOptions,
  IndicatorsChangeHandler,
} from '@/types/chart'
import {
  TIMEFRAMES,
  SYMBOLS,
  DEFAULT_INDICATOR_SETTINGS,
  type Timeframe,
  type SymbolValue,
} from '@/constants/chart'
import type { IndicatorSettings } from '@/constants/chart'

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
            <Select
              value={symbol}
              onValueChange={(v) => v && onSymbolChange(v as SymbolValue)}
            >
              <SelectTrigger
                className="w-[8.5rem]"
                data-testid="symbol-trigger"
                aria-label="Symbol"
              >
                <SelectValue>
                  {SYMBOLS.find(s => s.value === symbol)?.label || symbol}
                </SelectValue>
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
          <Select
            value={timeframe}
            onValueChange={(v) => v && onTimeframeChange(v as Timeframe)}
          >
            <SelectTrigger
              className="w-[8.5rem]"
              data-testid="timeframe-trigger"
              aria-label="Timeframe"
            >
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
              <DropdownMenuCheckboxItem
                checked={indicators.ma}
                onCheckedChange={(checked) => onIndicatorsChange({ ...indicators, ma: checked })}
                onSelect={(e) => e.preventDefault()}
              >
                <TrendingUp className="h-4 w-4 mr-2 opacity-70" />
                移動平均線 (MA)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={indicators.rsi}
                onCheckedChange={(checked) => onIndicatorsChange({ ...indicators, rsi: checked })}
                onSelect={(e) => e.preventDefault()}
                data-testid="checkbox-rsi"
              >
                <Activity className="h-4 w-4 mr-2 opacity-70" />
                RSI
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={!!indicators.macd}
                onCheckedChange={(checked) => onIndicatorsChange({ ...indicators, macd: checked })}
                onSelect={(e) => e.preventDefault()}
                data-testid="checkbox-macd"
              >
                <BarChart3 className="h-4 w-4 mr-2 opacity-70" />
                MACD
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={!!indicators.boll}
                onCheckedChange={(checked) => onIndicatorsChange({ ...indicators, boll: checked })}
                onSelect={(e) => e.preventDefault()}
              >
                <Waves className="h-4 w-4 mr-2 opacity-70" />
                Bollinger Bands
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:flex items-center gap-1.5 text-muted-foreground ml-2">
            {indicators.ma && <TrendingUp className="h-3.5 w-3.5" />}
            {indicators.rsi && <Activity className="h-3.5 w-3.5" />}
            {indicators.macd && <BarChart3 className="h-3.5 w-3.5" />}
            {indicators.boll && <Waves className="h-3.5 w-3.5" />}
          </div>
        </div>

        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 rounded hover:bg-accent"
              aria-label="Indicator settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-4">
            <h3 className="text-lg font-medium mb-2">指標設定</h3>
            <Accordion type="single" collapsible className="w-full space-y-1">
              <AccordionItem value="ma-settings">
                <AccordionTrigger 
                  onSelect={(e) => e.preventDefault()}
                >
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
                        onSettingsChange({
                          ...settings,
                          sma: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>MA Width</span>
                      <div className="flex items-center gap-2">
                        <span>{settings.lineWidth.ma}px</span>
                        <input 
                          type="color" 
                          value={settings.colors?.ma || DEFAULT_INDICATOR_SETTINGS.colors!.ma}
                          className="w-6 h-6 p-0.5 border rounded cursor-pointer bg-background"
                          onChange={(e) => onSettingsChange({
                            ...settings,
                            colors: { ...settings.colors, ma: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.lineWidth.ma}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      onChange={(e) =>
                        onSettingsChange({
                          ...settings,
                          lineWidth: {
                            ...settings.lineWidth,
                            ma: Number(e.target.value),
                          },
                        })
                      }
                    />
                    <div className="mt-1 h-5 w-full bg-muted/30 dark:bg-muted/20 rounded flex items-center justify-center overflow-hidden p-[2px]">
                      <div
                        style={{
                          height: `${settings.lineWidth.ma}px`,
                          width: '100%',
                          backgroundColor: settings.colors?.ma || DEFAULT_INDICATOR_SETTINGS.colors!.ma,
                          borderRadius: '2px',
                        }}
                      ></div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="rsi-settings">
                <AccordionTrigger
                  onSelect={(e) => e.preventDefault()}
                >
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
                        onSettingsChange({
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
                        onSettingsChange({
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
                        onSettingsChange({
                          ...settings,
                          rsiLower: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>RSI Width</span>
                      <div className="flex items-center gap-2">
                        <span>{settings.lineWidth.rsi}px</span>
                        <input 
                          type="color" 
                          value={settings.colors?.rsi || DEFAULT_INDICATOR_SETTINGS.colors!.rsi}
                          className="w-6 h-6 p-0.5 border rounded cursor-pointer bg-background"
                          onChange={(e) => onSettingsChange({
                            ...settings,
                            colors: { ...settings.colors, rsi: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.lineWidth.rsi}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      onChange={(e) =>
                        onSettingsChange({
                          ...settings,
                          lineWidth: {
                            ...settings.lineWidth,
                            rsi: Number(e.target.value),
                          },
                        })
                      }
                    />
                    <div className="mt-1 h-5 w-full bg-muted/30 dark:bg-muted/20 rounded flex items-center justify-center overflow-hidden p-[2px]">
                      <div
                        style={{
                          height: `${settings.lineWidth.rsi}px`,
                          width: '100%',
                          backgroundColor: settings.colors?.rsi || DEFAULT_INDICATOR_SETTINGS.colors!.rsi,
                          borderRadius: '2px',
                        }}
                      ></div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="macd-settings">
                <AccordionTrigger
                  onSelect={(e) => e.preventDefault()}
                >
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
                        onSettingsChange({
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
                        onSettingsChange({
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
                        onSettingsChange({
                          ...settings,
                          macd: {
                            ...settings.macd,
                            signal: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>MACD Width</span>
                      <div className="flex items-center gap-2">
                        <span>{settings.lineWidth.macd}px</span>
                        <input 
                          type="color" 
                          value={settings.colors?.macd || DEFAULT_INDICATOR_SETTINGS.colors!.macd}
                          className="w-6 h-6 p-0.5 border rounded cursor-pointer bg-background"
                          onChange={(e) => onSettingsChange({
                            ...settings,
                            colors: { ...settings.colors, macd: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.lineWidth.macd}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      onChange={(e) =>
                        onSettingsChange({
                          ...settings,
                          lineWidth: {
                            ...settings.lineWidth,
                            macd: Number(e.target.value),
                          },
                        })
                      }
                    />
                    <div className="mt-1 h-5 w-full bg-muted/30 dark:bg-muted/20 rounded flex items-center justify-center overflow-hidden p-[2px]">
                      <div
                        style={{
                          height: `${settings.lineWidth.macd}px`,
                          width: '100%',
                          backgroundColor: settings.colors?.macd || DEFAULT_INDICATOR_SETTINGS.colors!.macd,
                          borderRadius: '2px',
                        }}
                      ></div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="boll-settings">
                <AccordionTrigger
                  onSelect={(e) => e.preventDefault()}
                >
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
                        onSettingsChange({
                          ...settings,
                          boll: {
                            ...settings.boll,
                            period: Number(e.target.value)
                          },
                        })
                      }
                    />
                  </label>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>BOLL Width</span>
                      <div className="flex items-center gap-2">
                        <span>{settings.lineWidth.boll}px</span>
                        <input 
                          type="color" 
                          value={settings.colors?.boll || DEFAULT_INDICATOR_SETTINGS.colors!.boll}
                          className="w-6 h-6 p-0.5 border rounded cursor-pointer bg-background"
                          onChange={(e) => onSettingsChange({
                            ...settings,
                            colors: { ...settings.colors, boll: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.lineWidth.boll}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      onChange={(e) =>
                        onSettingsChange({
                          ...settings,
                          lineWidth: {
                            ...settings.lineWidth,
                            boll: Number(e.target.value),
                          },
                        })
                      }
                    />
                    <div className="mt-1 h-5 w-full bg-muted/30 dark:bg-muted/20 rounded flex items-center justify-center overflow-hidden p-[2px]">
                      <div
                        style={{
                          height: `${settings.lineWidth.boll}px`,
                          width: '100%',
                          backgroundColor: settings.colors?.boll || DEFAULT_INDICATOR_SETTINGS.colors!.boll,
                          borderRadius: '2px',
                        }}
                      ></div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
