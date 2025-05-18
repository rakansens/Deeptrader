'use client'

/**
 * チャートの期間やインジケーターを切り替えるツールバー
 * すべてのコントロールを横一列に配置して切替を容易にする
 */

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { TrendingUp, Activity, BarChart3, Waves } from 'lucide-react'

interface ChartToolbarProps {
  timeframe: string
  onTimeframeChange: (timeframe: string) => void
  symbol?: string
  onSymbolChange?: (symbol: string) => void
  indicators: {
    ma: boolean
    rsi: boolean
    macd?: boolean
    boll?: boolean
  }
  onIndicatorsChange: (value: { ma: boolean; rsi: boolean; macd?: boolean; boll?: boolean }) => void
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d']
const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'BNBUSDT', label: 'BNB/USDT' }
]

export default function ChartToolbar({
  timeframe,
  onTimeframeChange,
  symbol = 'BTCUSDT',
  onSymbolChange,
  indicators,
  onIndicatorsChange,
}: ChartToolbarProps) {
  return (
    <div
      data-testid="chart-toolbar"
      className="flex flex-wrap items-center gap-4 p-4"
    >
      <div className="flex gap-4 items-center">
        {onSymbolChange && (
          <select
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
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
          onValueChange={(v) => v && onTimeframeChange(v)}
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
      </div>
    </div>
  )
}
