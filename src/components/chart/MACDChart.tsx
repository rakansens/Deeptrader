'use client'

import { useEffect, useRef } from 'react'
import { createChart, IChartApi, LineData, HistogramData, UTCTimestamp } from 'lightweight-charts'
import { useTheme } from 'next-themes'
import useCandlestickData from '@/hooks/use-candlestick-data'

interface MACDChartProps {
  symbol: string;
  interval: string;
  height?: number;
}

export default function MACDChart({ symbol, interval, height = 150 }: MACDChartProps) {
  const { theme = 'light' } = useTheme()
  const isDark = theme === 'dark'
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  
  // テーマに応じた色を設定
  const colors = {
    background: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#d1d5db' : '#111827',
    grid: isDark ? '#2f3338' : '#e0e0e0',
    macdLine: '#2962FF',
    signalLine: '#FF6D00',
    histogramPositive: '#26a69a',
    histogramNegative: '#ef5350'
  }
  
  // データを取得
  const { macd, signal, loading } = useCandlestickData(symbol, interval)
  
  // 重複するタイムスタンプを処理する関数
  const preprocessData = (data: LineData[]): LineData[] => {
    const timeMap = new Map<number, LineData>()
    
    data.forEach(item => {
      if (typeof item.time === 'number' || typeof item.time === 'string') {
        const timeAsNumber = typeof item.time === 'number' 
          ? item.time 
          : new Date(item.time).getTime() / 1000;
        
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
  
  // ヒストグラムデータを作成
  const createHistogramData = (macdData: LineData[], signalData: LineData[]): HistogramData[] => {
    const result: HistogramData[] = []
    const macdMap = new Map<number, number>()
    const signalMap = new Map<number, number>()
    
    // MACDデータをマップに格納
    macdData.forEach(item => {
      if (typeof item.time === 'number') {
        macdMap.set(item.time, item.value)
      }
    })
    
    // シグナルデータをマップに格納
    signalData.forEach(item => {
      if (typeof item.time === 'number') {
        signalMap.set(item.time, item.value)
      }
    })
    
    // 両方のデータが存在する時間でヒストグラムを作成
    macdMap.forEach((macdValue, time) => {
      const signalValue = signalMap.get(time)
      if (signalValue !== undefined) {
        const diff = macdValue - signalValue
        result.push({
          time: time as UTCTimestamp,
          value: diff,
          color: diff >= 0 ? colors.histogramPositive : colors.histogramNegative
        })
      }
    })
    
    return result.sort((a, b) => {
      const timeA = typeof a.time === 'number' ? a.time : 0
      const timeB = typeof b.time === 'number' ? b.time : 0
      return timeA - timeB
    })
  }
  
  useEffect(() => {
    if (!containerRef.current || loading || macd.length === 0 || signal.length === 0) return
    
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
    
    // MACD線
    const macdSeries = chart.addLineSeries({
      color: colors.macdLine,
      lineWidth: 2,
      priceLineVisible: false,
    })
    
    // シグナル線
    const signalSeries = chart.addLineSeries({
      color: colors.signalLine,
      lineWidth: 1,
      priceLineVisible: false,
    })
    
    // ヒストグラム
    const histogramSeries = chart.addHistogramSeries({
      color: colors.histogramPositive,
      priceFormat: {
        type: 'price',
        precision: 2,
      },
      priceLineVisible: false,
    })
    
    // データを前処理して設定
    const processedMacd = preprocessData(macd)
    const processedSignal = preprocessData(signal)
    const histogramData = createHistogramData(processedMacd, processedSignal)
    
    // データを設定
    macdSeries.setData(processedMacd)
    signalSeries.setData(processedSignal)
    histogramSeries.setData(histogramData)
    
    // タイムスケールの範囲を取得
    const timeScale = chart.timeScale()
    if (processedMacd.length > 0) {
      const minTime = processedMacd[0].time
      const maxTime = processedMacd[processedMacd.length - 1].time
      
      // 表示範囲を調整
      if (typeof minTime === 'number' && typeof maxTime === 'number') {
        timeScale.setVisibleRange({
          from: minTime as UTCTimestamp,
          to: maxTime as UTCTimestamp,
        })
      }
    }
    
    // ゼロラインを追加
    const zeroLine = chart.addLineSeries({
      color: '#888888',
      lineWidth: 1,
      lineStyle: 2, // 点線
      priceLineVisible: false,
    })
    
    // ゼロラインのデータを作成
    const zeroLineData: LineData[] = []
    if (processedMacd.length > 0) {
      processedMacd.forEach(item => {
        zeroLineData.push({ time: item.time, value: 0 })
      })
      zeroLine.setData(zeroLineData)
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
  }, [macd, signal, loading, height, colors])
  
  return <div ref={containerRef} className="w-full h-full" />
} 