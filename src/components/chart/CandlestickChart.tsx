'use client'

import { createChart, type CandlestickData, type IChartApi, type UTCTimestamp, type HistogramData } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

interface CandlestickChartProps {
  className?: string
  height?: number
}

/**
 * Binanceのローソク足データを表示するチャートコンポーネント
 */
export default function CandlestickChart({ className, height = 400 }: CandlestickChartProps) {
  const { theme = 'light' } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ReturnType<IChartApi['addCandlestickSeries']> | null>(null)
  const volumeSeriesRef = useRef<ReturnType<IChartApi['addHistogramSeries']> | null>(null)

  const [symbol, setSymbol] = useState('BTCUSDT')
  const [interval, setInterval] = useState('1m')

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
  }, [theme, height])

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

  // データ取得とWebSocket購読
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
        const candles: CandlestickData[] = raw.map((d: any) => ({
          time: (d[0] / 1000) as UTCTimestamp,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }))
        const volumes: HistogramData[] = raw.map((d: any) => ({
          time: (d[0] / 1000) as UTCTimestamp,
          value: parseFloat(d[5]),
          color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#26a69a' : '#ef5350',
        }))
        candleSeriesRef.current!.setData(candles)
        volumeSeriesRef.current!.setData(volumes)
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
    }

    return () => {
      controller.abort()
      ws?.close()
    }
  }, [symbol, interval])

  return (
    <div className={className}>
      <div className="mb-2 flex space-x-2 text-sm">
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="BTCUSDT">BTC/USDT</option>
          <option value="ETHUSDT">ETH/USDT</option>
          <option value="BNBUSDT">BNB/USDT</option>
        </select>
        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="1m">1m</option>
          <option value="5m">5m</option>
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="4h">4h</option>
          <option value="1d">1d</option>
        </select>
      </div>
      <div ref={containerRef} className="w-full" style={{ height }} />
    </div>
  )
}
