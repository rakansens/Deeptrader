import { useEffect } from 'react'
import type { IChartApi, ISeriesApi, LineData } from 'lightweight-charts'
import { preprocessLineData } from '@/lib/chart-utils'

interface UseLineSeriesParams {
  chart: IChartApi | null
  ref: React.MutableRefObject<ISeriesApi<'Line'> | null>
  enabled: boolean
  options: Parameters<IChartApi['addLineSeries']>[0]
  data: LineData[]
}

/**
 * ラインシリーズの生成と削除を管理するフック
 */
export function useLineSeries({
  chart,
  ref,
  enabled,
  options,
  data
}: UseLineSeriesParams) {
  useEffect(() => {
    if (!chart) return

    if (enabled) {
      if (!ref.current) {
        ref.current = chart.addLineSeries(options)
      }
      const processed = preprocessLineData(data)
      if (ref.current && processed.length > 0) {
        ref.current.setData(processed)
      }
    } else if (ref.current) {
      try {
        chart.removeSeries(ref.current)
      } catch (e) {
        console.error('Error removing series:', e)
      }
      ref.current = null
    }
  }, [chart, ref, enabled, options, data])
}

export default useLineSeries
