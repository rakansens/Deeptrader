'use client'

import { useEffect, useRef } from 'react'
import { createChart, IChartApi, LineData, HistogramData, UTCTimestamp } from 'lightweight-charts'
import { useTheme } from 'next-themes'
import useCandlestickData from '@/hooks/use-candlestick-data'

interface RSIChartProps {
  symbol: string;
  interval: string;
  height?: number;
}

export default function RSIChart({ symbol, interval, height = 150 }: RSIChartProps) {
  const { theme = 'light' } = useTheme()
  const isDark = theme === 'dark'
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  
  // テーマに応じた色を設定
  const colors = {
    background: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#d1d5db' : '#111827',
    grid: isDark ? '#2f3338' : '#e0e0e0',
    rsiLine: '#2962FF'
  }
  
  // データを取得
  const { rsi, loading } = useCandlestickData(symbol, interval)
  
  // 重複するタイムスタンプを処理する関数
  const preprocessData = (data: LineData[]): LineData[] => {
    const timeMap = new Map<number, LineData>()
    
    data.forEach(item => {
      if (typeof item.time === 'number' || typeof item.time === 'string') {
        const timeAsNumber = typeof item.time === 'number' 
          ? item.time 
          : new Date(item.time as string).getTime() / 1000;
        
        timeMap.set(timeAsNumber, {
          ...item,
          time: timeAsNumber as UTCTimestamp
        })
      }
    })
    
    return Array.from(timeMap.values())
      .sort((a, b) => {
        const timeA = typeof a.time === 'number' ? a.time : 0
        const timeB = typeof b.time === 'number' ? b.time : 0
        return timeA - timeB
      })
  }
  
  useEffect(() => {
    if (!containerRef.current || loading || rsi.length === 0) return
    
    // 既存のチャートをクリーンアップ
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }
    
    // チャートを作成
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      rightPriceScale: {
        borderColor: colors.grid,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: colors.grid,
        timeVisible: true,
      },
    })
    
    chartRef.current = chart
    
    // RSIライン
    const rsiSeries = chart.addLineSeries({
      color: colors.rsiLine,
      lineWidth: 2,
      priceLineVisible: false,
    })
    
    // オーバーソールドとオーバーボートのラインを追加
    const overboughtSeries = chart.addLineSeries({
      color: '#FF4560',
      lineWidth: 1,
      lineStyle: 2, // 点線
      priceLineVisible: false,
    })
    
    const oversoldSeries = chart.addLineSeries({
      color: '#00E396',
      lineWidth: 1,
      lineStyle: 2, // 点線
      priceLineVisible: false,
    })
    
    // データを前処理して設定
    const processedData = preprocessData(rsi)
    
    // タイムスケールの範囲を取得
    const timeScale = chart.timeScale()
    const minVisibleBar = processedData.length > 0 ? processedData[0].time : 0
    const maxVisibleBar = processedData.length > 0 ? processedData[processedData.length - 1].time : 0
    
    // オーバーソールド/オーバーボートのラインデータを作成
    const overboughtData: LineData[] = []
    const oversoldData: LineData[] = []
    
    processedData.forEach(item => {
      overboughtData.push({ time: item.time, value: 70 })
      oversoldData.push({ time: item.time, value: 30 })
    })
    
    // データを設定
    rsiSeries.setData(processedData)
    overboughtSeries.setData(overboughtData)
    oversoldSeries.setData(oversoldData)
    
    // 表示範囲を調整
    if (typeof minVisibleBar === 'number' && typeof maxVisibleBar === 'number') {
      timeScale.setVisibleRange({
        from: minVisibleBar as UTCTimestamp,
        to: maxVisibleBar as UTCTimestamp,
      })
    }
    
    // リサイズハンドラ
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        })
      }
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [rsi, loading, height, colors])
  
  return <div ref={containerRef} className="w-full h-full" />
} 