'use client'

import { createChart, type CandlestickData, type IChartApi, type UTCTimestamp, type HistogramData, type LineData } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'

/** SMAの計算 */
function computeSMA(data: number[], period: number): number | null {
  if (data.length < period) return null
  const slice = data.slice(-period)
  const sum = slice.reduce((a, b) => a + b, 0)
  return sum / period
}

/** EMAの計算 */
function computeEMA(data: number[], period: number): number | null {
  if (data.length < period) return null
  const k = 2 / (period + 1)
  let ema = data[data.length - period]
  for (let i = data.length - period + 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k)
  }
  return ema
}

/** RSIの計算 */
function computeRSI(data: number[], period: number): number | null {
  if (data.length < period + 1) return null
  let gains = 0
  let losses = 0
  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i] - data[i - 1]
    if (diff >= 0) gains += diff
    else losses -= diff
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/** MACDの計算 */
function computeMACD(prices: number[], macdHist: number[]): { macd: number; signal: number } | null {
  const fast = computeEMA(prices, 12)
  const slow = computeEMA(prices, 26)
  if (fast === null || slow === null) return null
  const macdLine = fast - slow
  macdHist.push(macdLine)
  const signal = computeEMA(macdHist, 9)
  if (signal === null) return null
  return { macd: macdLine, signal }
}

/** ボリンジャーバンドの計算 */
function computeBollinger(data: number[], period = 20): { upper: number; lower: number } | null {
  if (data.length < period) return null
  const slice = data.slice(-period)
  const mean = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period
  const sd = Math.sqrt(variance)
  return { upper: mean + 2 * sd, lower: mean - 2 * sd }
}

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
}

/**
 * Binanceのローソク足データを表示するチャートコンポーネント
 * APIモードでは/api/candlesエンドポイントからデータを取得
 * 直接モードではBinance APIに直接アクセス
 */
export default function CandlestickChart({ 
  className, 
  height = 400, 
  symbol: initialSymbol = 'BTCUSDT',
  interval: initialInterval = '1m',
  useApi = false,
  indicators = { ma: false, rsi: false, macd: false, boll: false }
}: CandlestickChartProps) {
  const { theme = 'light' } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ReturnType<IChartApi['addCandlestickSeries']> | null>(null)
  const volumeSeriesRef = useRef<ReturnType<IChartApi['addHistogramSeries']> | null>(null)
  const maSeriesRef = useRef<ReturnType<IChartApi['addLineSeries']> | null>(null)
  const rsiSeriesRef = useRef<ReturnType<IChartApi['addLineSeries']> | null>(null)
  const macdSeriesRef = useRef<ReturnType<IChartApi['addLineSeries']> | null>(null)
  const signalSeriesRef = useRef<ReturnType<IChartApi['addLineSeries']> | null>(null)
  const bollUpperSeriesRef = useRef<ReturnType<IChartApi['addLineSeries']> | null>(null)
  const bollLowerSeriesRef = useRef<ReturnType<IChartApi['addLineSeries']> | null>(null)

  const closePricesRef = useRef<number[]>([])
  const macdHistoryRef = useRef<number[]>([])
  const maDataRef = useRef<LineData[]>([])
  const rsiDataRef = useRef<LineData[]>([])
  const macdLineDataRef = useRef<LineData[]>([])
  const signalLineDataRef = useRef<LineData[]>([])
  const bollUpperDataRef = useRef<LineData[]>([])
  const bollLowerDataRef = useRef<LineData[]>([])

  const [symbol, setSymbol] = useState(initialSymbol)
  const [interval, setInterval] = useState(initialInterval)

  // 外部からのprops変更を検知して内部状態を更新
  useEffect(() => {
    if (initialInterval !== interval) {
      setInterval(initialInterval)
    }
  }, [initialInterval])
  
  useEffect(() => {
    if (initialSymbol !== symbol) {
      setSymbol(initialSymbol)
    }
  }, [initialSymbol])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // チャートの初期化
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: theme === 'dark' ? '#1e1e1e' : '#ffffff' },
        textColor: theme === 'dark' ? '#d1d5db' : '#111827',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
        horzLines: { color: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
      timeScale: { borderColor: theme === 'dark' ? '#2f3338' : '#e0e0e0', timeVisible: true },
    })

    chartRef.current = chart
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })
    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
      color: '#4b5563',
    })
    if (indicators.ma) {
      maSeriesRef.current = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2, priceLineVisible: false })
    }
    if (indicators.rsi) {
      rsiSeriesRef.current = chart.addLineSeries({ color: '#3b82f6', lineWidth: 1, priceLineVisible: false })
    }
    if (indicators.macd) {
      macdSeriesRef.current = chart.addLineSeries({ color: '#10b981', lineWidth: 1, priceLineVisible: false })
      signalSeriesRef.current = chart.addLineSeries({ color: '#ef4444', lineWidth: 1, priceLineVisible: false })
    }
    if (indicators.boll) {
      bollUpperSeriesRef.current = chart.addLineSeries({ color: '#a855f7', lineWidth: 1, priceLineVisible: false })
      bollLowerSeriesRef.current = chart.addLineSeries({ color: '#a855f7', lineWidth: 1, priceLineVisible: false })
    }

    // ボリュームのスケール設定
    chart.priceScale('vol').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(containerRef.current.clientWidth, height)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [theme, height, indicators])

  // テーマ変更時のスタイル更新
  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.applyOptions({
      layout: {
        background: { color: theme === 'dark' ? '#1e1e1e' : '#ffffff' },
        textColor: theme === 'dark' ? '#d1d5db' : '#111827',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
        horzLines: { color: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
      },
      rightPriceScale: { borderColor: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
      timeScale: { borderColor: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
    })
  }, [theme])

  // インジケーター表示切り替え
  useEffect(() => {
    if (!chartRef.current) return
    const chart = chartRef.current

    const ensureSeries = (cond: boolean, ref: React.MutableRefObject<ReturnType<IChartApi['addLineSeries']> | null>, opts: any, data: LineData[]) => {
      if (cond) {
        if (!ref.current) {
          ref.current = chart.addLineSeries(opts)
          ref.current.setData(data)
        }
      } else if (ref.current && chart) {
        try {
          chart.removeSeries(ref.current)
        } catch (e) {
          console.error('Error removing series:', e)
        }
        ref.current = null
      }
    }

    ensureSeries(indicators.ma, maSeriesRef, { color: '#f59e0b', lineWidth: 2, priceLineVisible: false }, maDataRef.current)
    ensureSeries(indicators.rsi, rsiSeriesRef, { color: '#3b82f6', lineWidth: 1, priceLineVisible: false }, rsiDataRef.current)
    if (indicators.macd) {
      ensureSeries(true, macdSeriesRef, { color: '#10b981', lineWidth: 1, priceLineVisible: false }, macdLineDataRef.current)
      ensureSeries(true, signalSeriesRef, { color: '#ef4444', lineWidth: 1, priceLineVisible: false }, signalLineDataRef.current)
    } else {
      if (macdSeriesRef.current && chart) { 
        try {
          chart.removeSeries(macdSeriesRef.current)
        } catch (e) {
          console.error('Error removing MACD series:', e)
        }
        macdSeriesRef.current = null 
      }
      if (signalSeriesRef.current && chart) { 
        try {
          chart.removeSeries(signalSeriesRef.current)
        } catch (e) {
          console.error('Error removing signal series:', e)
        }
        signalSeriesRef.current = null 
      }
    }
    if (indicators.boll) {
      ensureSeries(true, bollUpperSeriesRef, { color: '#a855f7', lineWidth: 1, priceLineVisible: false }, bollUpperDataRef.current)
      ensureSeries(true, bollLowerSeriesRef, { color: '#a855f7', lineWidth: 1, priceLineVisible: false }, bollLowerDataRef.current)
    } else {
      if (bollUpperSeriesRef.current && chart) { 
        try {
          chart.removeSeries(bollUpperSeriesRef.current)
        } catch (e) {
          console.error('Error removing bollinger upper series:', e)
        }
        bollUpperSeriesRef.current = null 
      }
      if (bollLowerSeriesRef.current && chart) { 
        try {
          chart.removeSeries(bollLowerSeriesRef.current)
        } catch (e) {
          console.error('Error removing bollinger lower series:', e)
        }
        bollLowerSeriesRef.current = null 
      }
    }
  }, [indicators])

  // APIを使用したデータ取得
  useEffect(() => {
    if (!candleSeriesRef.current) return

    const controller = new AbortController()
    let ws: WebSocket | null = null

    async function load() {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error('failed to fetch')
        const raw = (await res.json()) as unknown[]
        const candles: CandlestickData[] = []
        const volumes: HistogramData[] = []
        
        // データを処理してインジケーターに必要な情報も計算する
        raw.forEach((d: any) => {
          const candle: CandlestickData = {
            time: (d[0] / 1000) as UTCTimestamp,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          }
          candles.push(candle)
          
          const volume: HistogramData = {
            time: (d[0] / 1000) as UTCTimestamp,
            value: parseFloat(d[5]),
            color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#26a69a' : '#ef5350',
          }
          volumes.push(volume)

          const close = candle.close
          closePricesRef.current.push(close)

          // 移動平均の計算
          const ma = computeSMA(closePricesRef.current, 14)
          if (ma !== null) {
            const point = { time: candle.time, value: ma }
            maDataRef.current.push(point)
          }

          // RSIの計算
          const rsi = computeRSI(closePricesRef.current, 14)
          if (rsi !== null) {
            const point = { time: candle.time, value: rsi }
            rsiDataRef.current.push(point)
          }

          // MACDの計算
          const macd = computeMACD(closePricesRef.current, macdHistoryRef.current)
          if (macd) {
            macdLineDataRef.current.push({ time: candle.time, value: macd.macd })
            signalLineDataRef.current.push({ time: candle.time, value: macd.signal })
          }

          // ボリンジャーバンドの計算
          const boll = computeBollinger(closePricesRef.current)
          if (boll) {
            bollUpperDataRef.current.push({ time: candle.time, value: boll.upper })
            bollLowerDataRef.current.push({ time: candle.time, value: boll.lower })
          }
        })

        // チャートにデータをセット
        candleSeriesRef.current!.setData(candles)
        volumeSeriesRef.current!.setData(volumes)
        
        // インジケーターにもデータをセット
        if (maSeriesRef.current) maSeriesRef.current.setData(maDataRef.current)
        if (rsiSeriesRef.current) rsiSeriesRef.current.setData(rsiDataRef.current)
        if (macdSeriesRef.current) macdSeriesRef.current.setData(macdLineDataRef.current)
        if (signalSeriesRef.current) signalSeriesRef.current.setData(signalLineDataRef.current)
        if (bollUpperSeriesRef.current) bollUpperSeriesRef.current.setData(bollUpperDataRef.current)
        if (bollLowerSeriesRef.current) bollLowerSeriesRef.current.setData(bollLowerDataRef.current)
      } catch (e) {
        console.error(e)
      }
    }
    load()

    ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`)
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      const k = msg.k
      const candle: CandlestickData = {
        time: (k.t / 1000) as UTCTimestamp,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
      }
      candleSeriesRef.current?.update(candle)
      const volume: HistogramData = {
        time: (k.t / 1000) as UTCTimestamp,
        value: parseFloat(k.v),
        color: parseFloat(k.c) >= parseFloat(k.o) ? '#26a69a' : '#ef5350',
      }
      volumeSeriesRef.current?.update(volume)
      
      // リアルタイムでインジケーターも更新する
      closePricesRef.current.push(candle.close)
      if (closePricesRef.current.length > 1000) closePricesRef.current.shift()

      const ma = computeSMA(closePricesRef.current, 14)
      if (ma !== null && maSeriesRef.current) {
        maSeriesRef.current.update({ time: candle.time, value: ma })
      }

      const rsi = computeRSI(closePricesRef.current, 14)
      if (rsi !== null && rsiSeriesRef.current) {
        rsiSeriesRef.current.update({ time: candle.time, value: rsi })
      }

      const macd = computeMACD(closePricesRef.current, macdHistoryRef.current)
      if (macd && macdSeriesRef.current && signalSeriesRef.current) {
        macdSeriesRef.current.update({ time: candle.time, value: macd.macd })
        signalSeriesRef.current.update({ time: candle.time, value: macd.signal })
      }

      const boll = computeBollinger(closePricesRef.current)
      if (boll && bollUpperSeriesRef.current && bollLowerSeriesRef.current) {
        bollUpperSeriesRef.current.update({ time: candle.time, value: boll.upper })
        bollLowerSeriesRef.current.update({ time: candle.time, value: boll.lower })
      }
    }

    return () => {
      controller.abort()
      ws?.close()
      // クリーンアップ時にデータもリセット
      closePricesRef.current = []
      macdHistoryRef.current = []
      maDataRef.current = []
      rsiDataRef.current = []
      macdLineDataRef.current = []
      signalLineDataRef.current = []
      bollUpperDataRef.current = []
      bollLowerDataRef.current = []
    }
  }, [symbol, interval, useApi]);

  // ローディング中の表示
  if (loading && useApi) {
    return <Skeleton data-testid="loading" className="w-full h-[300px]" />;
  }

  // エラー表示
  if (error && useApi) {
    return (
      <div data-testid="error" className="text-center text-sm text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="w-full" style={{ height }} data-testid="chart-container" />
    </div>
  )
}
