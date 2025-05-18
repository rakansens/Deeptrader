'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, BarData, UTCTimestamp } from 'lightweight-charts'

import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'

interface CandlestickChartProps {
  symbol: string
  interval: string
}

/**
 * ローソク足チャートを表示するコンポーネント
 * @param symbol - 例: "BTCUSDT"
 * @param interval - 例: "1m"
 */
export function CandlestickChart({ symbol, interval }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/candles?symbol=${symbol}&interval=${interval}`)
        if (!res.ok) throw new Error('Failed to fetch candlesticks')
        const json = await res.json()
        const candles: BarData[] = (json || []).map((d: any) => ({
          time: d.time as UTCTimestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))

        if (!containerRef.current) return
        const chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: 300,
        })
        chartRef.current = chart
        const series = chart.addCandlestickSeries()
        seriesRef.current = series
        series.setData(candles)
      } catch (e) {
        const message = (e as Error).message
        setError(message)
        toast({
          title: 'データ取得に失敗しました',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => {
      chartRef.current?.remove()
    }
  }, [symbol, interval])

  if (loading) {
    return <Skeleton data-testid="loading" className="w-full h-[300px]" />
  }

  if (error) {
    return (
      <div data-testid="error" className="text-center text-sm text-red-500">
        {error}
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-[300px]" />
} 