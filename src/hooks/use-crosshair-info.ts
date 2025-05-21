import { useEffect, useState } from 'react'
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  UTCTimestamp,
  MouseEventParams,
} from 'lightweight-charts'

export interface CrosshairInfo {
  time: UTCTimestamp
  open: number
  high: number
  low: number
  close: number
  volume?: number
  change: number
  changePercent: number
}

interface UseCrosshairInfoParams {
  chart: IChartApi | null
  candleSeries: ISeriesApi<'Candlestick'> | null
  volumeSeries?: ISeriesApi<'Histogram'> | null
}

/**
 * subscribeCrosshairMove を利用してクロスヘア位置の情報を取得するフック
 */
export function useCrosshairInfo({
  chart,
  candleSeries,
  volumeSeries,
}: UseCrosshairInfoParams) {
  const [info, setInfo] = useState<CrosshairInfo | null>(null)

  useEffect(() => {
    if (!chart || !candleSeries) return

    const handler = (param: MouseEventParams) => {
      if (!param.time) {
        setInfo(null)
        return
      }
      const candle = param.seriesData.get(
        candleSeries
      ) as CandlestickData<UTCTimestamp> | undefined
      if (!candle) {
        setInfo(null)
        return
      }
      const vol = volumeSeries
        ? ((param.seriesData.get(
            volumeSeries
          ) as HistogramData<UTCTimestamp> | undefined)?.value ?? undefined)
        : undefined
      const change = candle.close - candle.open
      const percent = candle.open !== 0 ? (change / candle.open) * 100 : 0
      setInfo({
        time: param.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: vol,
        change,
        changePercent: percent,
      })
    }

    chart.subscribeCrosshairMove(handler)
    return () => {
      chart.unsubscribeCrosshairMove(handler)
    }
  }, [chart, candleSeries, volumeSeries])

  return info
}

export default useCrosshairInfo
