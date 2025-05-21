import { useEffect, useMemo, useRef } from 'react'
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
  colors,
}: UseCandlestickSeriesParams) {
  const prevCandleLength = useRef(0)
  const prevVolumeLength = useRef(0)
  const processedCandles = useMemo(
    () => processTimeSeriesData<CandlestickData>(candles, toNumericTime),
    [candles]
  )
  const processedVolumes = useMemo(
    () => processTimeSeriesData<HistogramData>(volumes, toNumericTime),
    [volumes]
  )

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
        prevCandleLength.current = 0
      }
      if (volumeRef.current) {
        try {
          chart.removeSeries(volumeRef.current)
        } catch {
          /* ignore */
        }
        volumeRef.current = null
        prevVolumeLength.current = 0
      }
    }
  }, [chart, candleRef, volumeRef, colors.upColor, colors.downColor, colors.volume])

  // テーマ変更時のオプション更新
  useEffect(() => {
    candleRef.current?.applyOptions({
      upColor: colors.upColor,
      downColor: colors.downColor,
      wickUpColor: colors.upColor,
      wickDownColor: colors.downColor,
      borderVisible: false,
    })
    volumeRef.current?.applyOptions({ color: colors.volume })
  }, [candleRef, volumeRef, colors.upColor, colors.downColor, colors.volume])

  // データ更新
  useEffect(() => {
    if (candleRef.current && processedCandles.length > 0) {
      if (prevCandleLength.current === processedCandles.length) {
        candleRef.current.update(
          processedCandles[processedCandles.length - 1]
        )
      } else {
        candleRef.current.setData(processedCandles)
      }
      prevCandleLength.current = processedCandles.length
    }
    if (volumeRef.current && processedVolumes.length > 0) {
      if (prevVolumeLength.current === processedVolumes.length) {
        volumeRef.current.update(
          processedVolumes[processedVolumes.length - 1]
        )
      } else {
        volumeRef.current.setData(processedVolumes)
      }
      prevVolumeLength.current = processedVolumes.length
    }
  }, [candleRef, volumeRef, processedCandles, processedVolumes])
}

export default useCandlestickSeries
