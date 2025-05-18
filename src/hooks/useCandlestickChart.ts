import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  UTCTimestamp,
} from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { calculateIndicators } from '@/lib/indicators'

interface IndicatorOptions {
  ma: boolean
  rsi: boolean
  macd?: boolean
  boll?: boolean
}

interface UseCandlestickChartParams {
  height: number
  theme: string
  symbol: string
  interval: string
  useApi: boolean
  indicators: IndicatorOptions
}

export function useCandlestickChart({
  height,
  theme,
  symbol,
  interval,
  useApi,
  indicators,
}: UseCandlestickChartParams) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const closePricesRef = useRef<number[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: { background: { color: theme === 'dark' ? '#1e1e1e' : '#fff' } },
    })
    chartRef.current = chart
    candleSeriesRef.current = chart.addCandlestickSeries()
    volumeSeriesRef.current = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol' })
    return () => chart.remove()
  }, [theme, height])

  useEffect(() => {
    if (!candleSeriesRef.current) return
    let ws: WebSocket | null = null
    async function load() {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`
        const res = await fetch(url)
        if (!res.ok) throw new Error('fetch failed')
        const raw = (await res.json()) as unknown[]
        const candles: CandlestickData[] = []
        const volumes: HistogramData[] = []
        raw.forEach((d: any) => {
          const c = { time: d[0] / 1000 as UTCTimestamp, open: +d[1], high: +d[2], low: +d[3], close: +d[4] }
          candles.push(c)
          volumes.push({ time: d[0] / 1000 as UTCTimestamp, value: +d[5], color: +d[4] >= +d[1] ? '#26a69a' : '#ef5350' })
          closePricesRef.current.push(c.close)
        })
        candleSeriesRef.current.setData(candles)
        volumeSeriesRef.current?.setData(volumes)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
    ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`)
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      const k = msg.k
      const candle = { time: k.t / 1000 as UTCTimestamp, open: +k.o, high: +k.h, low: +k.l, close: +k.c }
      candleSeriesRef.current?.update(candle)
      volumeSeriesRef.current?.update({ time: k.t / 1000 as UTCTimestamp, value: +k.v, color: +k.c >= +k.o ? '#26a69a' : '#ef5350' })
      closePricesRef.current.push(candle.close)
      calculateIndicators(closePricesRef.current) // placeholder for indicator updates
    }
    return () => ws?.close()
  }, [symbol, interval, useApi])

  return { containerRef, loading, error }
}
