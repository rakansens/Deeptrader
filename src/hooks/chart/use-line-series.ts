import { useEffect } from 'react'
import type { IChartApi, ISeriesApi, LineData } from 'lightweight-charts'
import { preprocessLineData } from '@/lib/chart'
import { logger } from '@/lib/logger'

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
      } else if (options) {
        // 既存のシリーズが存在する場合は、オプションを更新
        ref.current.applyOptions(options)
        // デバッグ用ログ
        if (options.lineWidth !== undefined) {
          logger.debug('Line series options updated - width:', options.lineWidth)
        }
      }
      const processed = preprocessLineData(data)
      if (ref.current && processed.length > 0) {
        ref.current.setData(processed)
      }
    } else if (ref.current) {
      try {
        chart.removeSeries(ref.current)
      } catch (e) {
        logger.error('Error removing series:', e)
      }
      ref.current = null
    }
  }, [chart, ref, enabled, options, data])
}

export default useLineSeries
