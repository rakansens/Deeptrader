'use client'
import { useRef, useCallback } from 'react'
import { IChartApi, ISeriesApi, LineData, HistogramData, UTCTimestamp } from 'lightweight-charts'
import IndicatorPanel from './IndicatorPanel'
import { useIndicatorChart } from '@/hooks/use-indicator-chart'
import useChartTheme from '@/hooks/use-chart-theme'
import { preprocessLineData, toNumericTime } from '@/lib/chart-utils'

interface MacdPanelProps {
  macd: LineData[]
  signal: LineData[]
  chart: IChartApi | null
  height: number
  onClose?: () => void
}

/**
 * MACDパネルコンポーネント
 */
export default function MacdPanel({ macd, signal, chart, height, onClose }: MacdPanelProps) {
  const chartRef = useRef<IChartApi | null>(null)
  const macdRef = useRef<ISeriesApi<'Line'> | null>(null)
  const signalRef = useRef<ISeriesApi<'Line'> | null>(null)
  const histRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const colors = useChartTheme()
  const createIndicatorChart = useIndicatorChart({
    height,
    colors,
    onSyncRange: range => {
      if (!range) return
      if (chart) {
        try {
          chart.timeScale().setVisibleLogicalRange(range)
        } catch {
          /* ignore */
        }
      }
    }
  })

  const initChart = useCallback((el: HTMLDivElement) => {
    const { chart: macdChart, series, cleanup } = createIndicatorChart(el, {
      color: '#2962FF',
      lineWidth: 2,
      title: 'MACD',
      priceLineVisible: false,
      lastValueVisible: true
    })
    chartRef.current = macdChart

    macdRef.current = series
    signalRef.current = macdChart.addLineSeries({
      color: '#FF6D00',
      lineWidth: 2,
      title: 'Signal',
      priceLineVisible: false,
      lastValueVisible: true
    })
    histRef.current = macdChart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'price' },
      priceScaleId: 'right',
      priceLineVisible: false,
      lastValueVisible: false
    })

    if (macdRef.current) {
      if (macd && macd.length > 0) {
        macdRef.current.setData(preprocessLineData(macd))
      } else {
        macdRef.current.setData([{ time: toNumericTime(Date.now()) as UTCTimestamp, value: 0 }])
      }
    }
    if (signalRef.current) {
      if (signal && signal.length > 0) {
        signalRef.current.setData(preprocessLineData(signal))
      } else {
        signalRef.current.setData([{ time: toNumericTime(Date.now()) as UTCTimestamp, value: 0 }])
      }
    }

    if (histRef.current && macd && signal && macd.length > 0 && signal.length > 0) {
      const raw: HistogramData[] = macd.map((m, idx) => {
        if (idx < signal.length) {
          const diff = (m.value as number) - (signal[idx].value as number)
          return { time: m.time, value: diff, color: diff >= 0 ? '#26a69a' : '#ef5350' }
        }
        return null
      }).filter(Boolean) as HistogramData[]

      const timeMap = new Map<number, HistogramData>()
      raw.forEach(item => {
        const key = toNumericTime(item.time)
        if (!timeMap.has(key)) timeMap.set(key, item)
      })
      const unique = Array.from(timeMap.values()).sort((a,b) => toNumericTime(a.time)-toNumericTime(b.time))
      const final: HistogramData[] = []
      let prev: number | null = null
      unique.forEach(it => {
        const cur = toNumericTime(it.time)
        if (cur !== prev) {
          final.push(it)
          prev = cur
        }
      })
      histRef.current.setData(final)
    }

    return () => {
      cleanup()
      chartRef.current = null
      macdRef.current = null
      signalRef.current = null
      histRef.current = null
    }
  }, [createIndicatorChart, macd, signal])

  return (
    <IndicatorPanel title="MACD" height={height} onClose={onClose} initChart={initChart} />
  )
}
