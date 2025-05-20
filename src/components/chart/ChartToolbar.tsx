'use client'

/**
 * チャートの期間やインジケーターを切り替えるツールバー
 * すべてのコントロールを横一列に配置して切替を容易にする
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
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm">
                <span>SMA</span>
                <input
                  type="number"
                  className="w-16 border rounded px-1 py-0.5 bg-background"
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
              <label className="flex items-center justify-between text-sm">
                <span>RSI</span>
                <input
                  type="number"
                  className="w-16 border rounded px-1 py-0.5 bg-background"
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
                <span>MACD Short</span>
                <input
                  type="number"
                  className="w-16 border rounded px-1 py-0.5 bg-background"
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
                <span>MACD Long</span>
                <input
                  type="number"
                  className="w-16 border rounded px-1 py-0.5 bg-background"
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
                <span>MACD Signal</span>
                <input
                  type="number"
                  className="w-16 border rounded px-1 py-0.5 bg-background"
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
              <label className="flex items-center justify-between text-sm">
                <span>Bollinger</span>
                <input
                  type="number"
                  className="w-16 border rounded px-1 py-0.5 bg-background"
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
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
