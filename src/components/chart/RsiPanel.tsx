'use client'
import { useRef, useCallback } from 'react'
import { IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts'
import IndicatorPanel from './IndicatorPanel'
import { useIndicatorChart } from '@/hooks/use-indicator-chart'
import useChartTheme from '@/hooks/use-chart-theme'
import { preprocessLineData, toNumericTime } from '@/lib/chart-utils'

interface RsiPanelProps {
  data: LineData[]
  chart: IChartApi | null
  height: number
  onClose?: () => void
}

/**
 * RSIパネルコンポーネント
 */
export default function RsiPanel({ data, chart, height, onClose }: RsiPanelProps) {
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)
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
    const { chart: rsiChart, series, cleanup } = createIndicatorChart(el, {
      color: '#2962FF',
      lineWidth: 2,
      title: 'RSI',
      priceLineVisible: false,
      lastValueVisible: true
    })
    chartRef.current = rsiChart

    // RSI特有の設定
    seriesRef.current = series

    const overSoldLine = rsiChart.addLineSeries({
      color: 'rgba(239, 83, 80, 0.5)',
      lineWidth: 1,
      lineStyle: 1,
      priceLineVisible: false,
      lastValueVisible: false
    })
    const overBoughtLine = rsiChart.addLineSeries({
      color: 'rgba(38, 166, 154, 0.5)',
      lineWidth: 1,
      lineStyle: 1,
      priceLineVisible: false,
      lastValueVisible: false
    })

    const timeFrom = toNumericTime(Date.now()) - 60 * 60 * 24 * 30
    const timeTo = toNumericTime(Date.now()) + 60 * 60 * 24
    overSoldLine.setData([
      { time: timeFrom as UTCTimestamp, value: 30 },
      { time: timeTo as UTCTimestamp, value: 30 }
    ])
    overBoughtLine.setData([
      { time: timeFrom as UTCTimestamp, value: 70 },
      { time: timeTo as UTCTimestamp, value: 70 }
    ])

    if (seriesRef.current) {
      if (data && data.length > 0) {
        seriesRef.current.setData(preprocessLineData(data))
      } else {
        seriesRef.current.setData([{ time: toNumericTime(Date.now()) as UTCTimestamp, value: 50 }])
      }
    }

    return () => {
      cleanup()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [createIndicatorChart, data])

  return (
    <IndicatorPanel title="RSI" height={height} onClose={onClose} initChart={initChart} />
  )
}
