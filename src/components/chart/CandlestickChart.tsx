'use client'

import { useTheme } from 'next-themes'
import { Skeleton } from '@/components/ui/skeleton'
import IndicatorPanel from './IndicatorPanel'
import { useCandlestickChart } from '@/hooks/useCandlestickChart'

interface IndicatorOptions {
  ma: boolean
  rsi: boolean
  macd?: boolean
  boll?: boolean
}

interface CandlestickChartProps {
  className?: string
  height?: number
  symbol?: string
  interval?: string
  useApi?: boolean
  indicators?: IndicatorOptions
  onIndicatorsChange?: (value: IndicatorOptions) => void
}

export default function CandlestickChart({
  className,
  height = 400,
  symbol = 'BTCUSDT',
  interval = '1m',
  useApi = false,
  indicators = { ma: false, rsi: false, macd: false, boll: false },
  onIndicatorsChange,
}: CandlestickChartProps) {
  const { theme = 'light' } = useTheme()
  const { containerRef, loading, error } = useCandlestickChart({
    height,
    theme,
    symbol,
    interval,
    useApi,
    indicators,
  })

  const subPanelHeight = height * 0.2
  const mainChartHeight =
    height - (indicators.rsi ? subPanelHeight : 0) - (indicators.macd ? subPanelHeight : 0)

  if (loading && useApi) {
    return <Skeleton data-testid="loading" className="w-full h-[300px]" />
  }

  if (error && useApi) {
    return (
      <div data-testid="error" className="text-center text-sm text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-1">
        <div ref={containerRef} className="w-full" style={{ height: mainChartHeight }} data-testid="chart-container" />
        {indicators.rsi && (
          <IndicatorPanel
            title="RSI"
            height={subPanelHeight}
            onClose={() => onIndicatorsChange?.({ ...indicators, rsi: false })}
            initChart={() => {}}
          />
        )}
        {indicators.macd && (
          <IndicatorPanel
            title="MACD"
            height={subPanelHeight}
            onClose={() => onIndicatorsChange?.({ ...indicators, macd: false })}
            initChart={() => {}}
          />
        )}
      </div>
    </div>
  )
}
