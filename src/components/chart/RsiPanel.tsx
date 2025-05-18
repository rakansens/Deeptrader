'use client'
import { useRef, useCallback } from 'react'
import { createChart, IChartApi, ISeriesApi, LineData, UTCTimestamp, CrosshairMode } from 'lightweight-charts'
import IndicatorPanel from './IndicatorPanel'
import useChartTheme from '@/hooks/use-chart-theme'
import { processTimeSeriesData, toNumericTime } from '@/lib/chart-utils'

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
  const colors = useChartTheme()
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  const initChart = useCallback((el: HTMLDivElement) => {
    const rsiChart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { color: colors.background },
        textColor: colors.text,
        fontFamily: 'Inter, sans-serif'
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid }
      },
      rightPriceScale: {
        borderColor: colors.grid,
        scaleMargins: { top: 0.1, bottom: 0.1 }
      },
      timeScale: {
        borderColor: colors.grid,
        timeVisible: true,
        secondsVisible: false
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { labelVisible: true },
        horzLine: { labelVisible: true }
      }
    })

    chartRef.current = rsiChart
    seriesRef.current = rsiChart.addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
      title: 'RSI',
      priceLineVisible: false,
      lastValueVisible: true
    })

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

    const timeFrom = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30
    const timeTo = Math.floor(Date.now() / 1000) + 60 * 60 * 24
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
        seriesRef.current.setData(processTimeSeriesData(data, toNumericTime))
      } else {
        seriesRef.current.setData([{ time: Math.floor(Date.now() / 1000) as UTCTimestamp, value: 50 }])
      }
    }

    if (chart) {
      const sync = (range: any) => {
        if (chartRef.current && range !== null) {
          chartRef.current.timeScale().setVisibleLogicalRange(range)
        }
      }
      chart.timeScale().subscribeVisibleLogicalRangeChange(sync)
      return () => {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(sync)
        rsiChart.remove()
        chartRef.current = null
        seriesRef.current = null
      }
    }

    return () => {
      rsiChart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [colors, height, data, chart])

  return (
    <IndicatorPanel title="RSI" height={height} onClose={onClose} initChart={initChart} />
  )
}
