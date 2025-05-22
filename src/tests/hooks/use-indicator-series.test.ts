import { renderHook } from '@testing-library/react'
import useIndicatorSeries from '@/hooks/chart/use-indicator-series'
import useLineSeries from '@/hooks/chart/use-line-series'
import type { ISeriesApi } from 'lightweight-charts'

jest.mock('@/hooks/chart/use-line-series')
const mockUseLineSeries = useLineSeries as jest.Mock

describe('useIndicatorSeries', () => {
  it('creates line series based on flags', () => {
    renderHook(() =>
      useIndicatorSeries({
        chart: null,
        maRef: { current: null } as React.MutableRefObject<ISeriesApi<'Line'> | null>,
        bollUpperRef: { current: null } as React.MutableRefObject<ISeriesApi<'Line'> | null>,
        bollLowerRef: { current: null } as React.MutableRefObject<ISeriesApi<'Line'> | null>,
        ma: [],
        bollUpper: [],
        bollLower: [],
        enabledMa: true,
        enabledBoll: false,
        lineWidth: { ma: 3, boll: 1 },
        colors: { ma: '#FF0000', boll: '#0000FF' }
      })
    )

    expect(mockUseLineSeries).toHaveBeenCalledTimes(3)
    expect(mockUseLineSeries.mock.calls[0][0]).toMatchObject({
      enabled: true,
      options: expect.objectContaining({ lineWidth: 3 })
    })
    expect(mockUseLineSeries.mock.calls[1][0]).toMatchObject({
      enabled: false,
      options: expect.objectContaining({ lineWidth: 1 })
    })
  })
})
