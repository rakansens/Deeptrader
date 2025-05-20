'use client'

/**
 * インジケーターの線幅設定UIをスライダーとリアルタイムプレビューに変更。
 */

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
import { TrendingUp, Activity, BarChart3, Waves, Settings } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type {
  IndicatorOptions,
  IndicatorsChangeHandler,
  IndicatorSettings,
} from '@/types/chart'
import {
  TIMEFRAMES,
  SYMBOLS,
  type Timeframe,
  type SymbolValue,
} from '@/constants/chart'
import { DEFAULT_INDICATOR_SETTINGS } from '@/types/chart'

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
          <select
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value as SymbolValue)}
            className="border rounded px-2 py-1 text-sm bg-background"
          >
            {SYMBOLS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}
        <ToggleGroup
          type="single"
          value={timeframe}
          onValueChange={(v) => v && onTimeframeChange(v as Timeframe)}
        >
          {TIMEFRAMES.map((tf) => (
            <ToggleGroupItem key={tf} value={tf} aria-label={`Timeframe ${tf}`}>
              {tf}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          <Switch
            id="ma-toggle"
            checked={indicators.ma}
            onCheckedChange={(v) =>
              onIndicatorsChange({ ...indicators, ma: v })
            }
          />
          <Label htmlFor="ma-toggle" className="text-xs sm:text-sm">
            MA
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" aria-hidden="true" />
          <Switch
            id="rsi-toggle"
            data-testid="switch-rsi"
            checked={indicators.rsi}
            onCheckedChange={(v) =>
              onIndicatorsChange({ ...indicators, rsi: v })
            }
          />
          <Label htmlFor="rsi-toggle" className="text-xs sm:text-sm">
            RSI
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          <Switch
            id="macd-toggle"
            data-testid="switch-macd"
            checked={!!indicators.macd}
            onCheckedChange={(v) =>
              onIndicatorsChange({ ...indicators, macd: v })
            }
          />
          <Label htmlFor="macd-toggle" className="text-xs sm:text-sm">
            MACD
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4" aria-hidden="true" />
          <Switch
            id="boll-toggle"
            checked={!!indicators.boll}
            onCheckedChange={(v) =>
              onIndicatorsChange({ ...indicators, boll: v })
            }
          />
          <Label htmlFor="boll-toggle" className="text-xs sm:text-sm">
            BOLL
          </Label>
        </div>
        <ThemeToggle />
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="p-1 rounded hover:bg-accent"
              aria-label="Indicator settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="w-80">
            <DialogHeader>
              <DialogTitle>指標設定</DialogTitle>
            </DialogHeader>
            <Accordion type="single" collapsible className="w-full space-y-1">
              <AccordionItem value="ma-settings">
                <AccordionTrigger>
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
                <AccordionContent className="pt-2 pb-3 space-y-3">
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
                <AccordionTrigger>
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
                <AccordionContent className="pt-2 pb-3 space-y-3">
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
                <AccordionTrigger>
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
                <AccordionContent className="pt-2 pb-3 space-y-3">
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
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="flex items-center">
                      <Waves className="h-4 w-4 mr-2 text-muted-foreground" />
                      Bollinger Bands
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>期間: {settings.boll}</span>
                      <span>太さ: {settings.lineWidth.boll}px</span>
                       <span 
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: settings.colors?.boll || DEFAULT_INDICATOR_SETTINGS.colors!.boll }}
                      ></span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-3 space-y-3">
                  <label className="flex items-center justify-between text-sm">
                    <span>期間</span>
                    <input
                      type="number"
                      className="w-20 border rounded px-1 py-0.5 bg-background text-sm"
                      value={settings.boll}
                      min={1}
                      onChange={(e) =>
                        onSettingsChange({
                          ...settings,
                          boll: Number(e.target.value),
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
