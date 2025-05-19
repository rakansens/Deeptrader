import { useEffect } from 'react'
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData } from 'lightweight-charts'
import { processTimeSeriesData, toNumericTime } from '@/lib/chart-utils'

interface CandlestickSeriesColors {
  upColor: string
  downColor: string
  volume: string
}

interface UseCandlestickSeriesParams {
  chart: IChartApi | null
  candleRef: React.MutableRefObject<ISeriesApi<'Candlestick'> | null>
  volumeRef: React.MutableRefObject<ISeriesApi<'Histogram'> | null>
  candles: CandlestickData[]
  volumes: HistogramData[]
  colors: CandlestickSeriesColors
}

/**
 * ローソク足シリーズと出来高シリーズを管理するフック
 */
export function useCandlestickSeries({
  chart,
  candleRef,
  volumeRef,
  candles,
  volumes,
  colors
}: UseCandlestickSeriesParams) {
  // シリーズの生成と破棄
  useEffect(() => {
    if (!chart) return

    if (!candleRef.current) {
      candleRef.current = chart.addCandlestickSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
        borderVisible: false
      })
    }
    if (!volumeRef.current) {
      volumeRef.current = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
        color: colors.volume
      })
      chart
        .priceScale('vol')
        .applyOptions({ scaleMargins: { top: 0.9, bottom: 0 } })
    }

    return () => {
      if (candleRef.current) {
        try {
          chart.removeSeries(candleRef.current)
        } catch {
          /* ignore */
        }
        candleRef.current = null
      }
      if (volumeRef.current) {
        try {
          chart.removeSeries(volumeRef.current)
        } catch {
          /* ignore */
        }
        volumeRef.current = null
      }
    }
  }, [chart])

  // テーマ変更時のオプション更新
  useEffect(() => {
    candleRef.current?.applyOptions({
      upColor: colors.upColor,
      downColor: colors.downColor,
      wickUpColor: colors.upColor,
      wickDownColor: colors.downColor,
      borderVisible: false
    })
    volumeRef.current?.applyOptions({ color: colors.volume })
  }, [colors])

  // データ更新
  useEffect(() => {
    if (candleRef.current && candles.length > 0) {
      candleRef.current.setData(
        processTimeSeriesData<CandlestickData>(candles, toNumericTime)
      )
    }
    if (volumeRef.current && volumes.length > 0) {
      volumeRef.current.setData(
        processTimeSeriesData<HistogramData>(volumes, toNumericTime)
      )
    }
  }, [candles, volumes])
}

export default useCandlestickSeries
