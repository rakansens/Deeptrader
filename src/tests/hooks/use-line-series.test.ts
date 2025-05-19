import { renderHook } from '@testing-library/react'
import { useLineSeries } from '@/hooks/use-line-series'
import { preprocessLineData } from '@/lib/chart-utils'
import type { IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts'

jest.mock('@/lib/chart-utils', () => ({
  preprocessLineData: jest.fn((d: LineData[]) => d)
}))

describe('useLineSeries', () => {
  it('adds and removes line series based on enabled flag', () => {
    const setData = jest.fn()
    const series: Partial<ISeriesApi<'Line'>> = { setData }
    const addLineSeries = jest.fn(() => series as ISeriesApi<'Line'>)
    const removeSeries = jest.fn()
    const chart = { addLineSeries, removeSeries } as unknown as IChartApi
    const ref = { current: null } as React.MutableRefObject<ISeriesApi<'Line'> | null>

    const { rerender } = renderHook(({ enabled }) =>
      useLineSeries({ chart, ref, enabled, options: {}, data: [{ time: 1 as UTCTimestamp, value: 2 }] })
    , { initialProps: { enabled: true } })

    expect(addLineSeries).toHaveBeenCalled()
    expect(setData).toHaveBeenCalled()

    rerender({ enabled: false })
    expect(removeSeries).toHaveBeenCalledWith(series)
    expect(ref.current).toBeNull()
  })
})
