import { useCallback } from 'react'
import {
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LineSeriesPartialOptions,
  LogicalRange
} from 'lightweight-charts'
import type { ChartTheme } from './use-chart-theme'

export interface UseIndicatorChartParams {
  height: number
  colors: ChartTheme
  onSyncRange?: (range: LogicalRange) => void
}

export interface IndicatorChartResult {
  chart: IChartApi
  series: ISeriesApi<'Line'>
  cleanup: () => void
}

/**
 * インジケータ用サブチャートを生成するフック
 */
export function useIndicatorChart({
  height,
  colors,
  onSyncRange
}: UseIndicatorChartParams) {
  return useCallback(
    (
      container: HTMLDivElement,
      seriesOptions: LineSeriesPartialOptions
    ): IndicatorChartResult => {
      const chart = createChart(container, {
        width: container.clientWidth,
        height,
        layout: { background: { color: colors.background }, textColor: colors.text },
        grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: colors.crosshair,
            labelVisible: true,
            labelBackgroundColor: colors.background
          },
          horzLine: {
            color: colors.crosshair,
            labelVisible: true,
            labelBackgroundColor: colors.background
          }
        },
        rightPriceScale: {
          borderColor: colors.grid,
          borderVisible: true,
          scaleMargins: { top: 0.1, bottom: 0.05 }
        },
        timeScale: {
          borderColor: colors.grid,
          visible: true,
          timeVisible: true,
          secondsVisible: false
        }
      })

      const series = chart.addLineSeries(seriesOptions)

      const listeners: Array<() => void> = []

      if (onSyncRange) {
        try {
          const scale = chart.timeScale()
          scale.subscribeVisibleLogicalRangeChange(onSyncRange)
          listeners.push(() => {
            try {
              scale.unsubscribeVisibleLogicalRangeChange(onSyncRange)
            } catch {
              /* ignore */
            }
          })
        } catch {
          /* ignore */
        }
      }

      const handleResize = () => {
        try {
          chart.resize(container.clientWidth, height)
        } catch {
          /* ignore */
        }
      }
      window.addEventListener('resize', handleResize)
      listeners.push(() => window.removeEventListener('resize', handleResize))

      return {
        chart,
        series,
        cleanup: () => {
          listeners.forEach(fn => {
            try {
              fn()
            } catch {
              /* ignore */
            }
          })
          try {
            chart.remove()
          } catch {
            /* ignore */
          }
        }
      }
    },
    [colors, height, onSyncRange]
  )
}

export default useIndicatorChart
