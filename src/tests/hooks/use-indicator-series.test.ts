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
        ma1Ref: { current: null } as React.MutableRefObject<ISeriesApi<'Line'> | null>,
        ma2Ref: { current: null } as React.MutableRefObject<ISeriesApi<'Line'> | null>,
        ma3Ref: { current: null } as React.MutableRefObject<ISeriesApi<'Line'> | null>,
        bollUpperRef: { current: null } as React.MutableRefObject<ISeriesApi<'Line'> | null>,
        bollLowerRef: { current: null } as React.MutableRefObject<ISeriesApi<'Line'> | null>,
        ma1: [],
        ma2: [],
        ma3: [],
        bollUpper: [],
        bollLower: [],
        enabledMa: true,
        enabledBoll: false,
        lineWidth: { ma: 3, boll: 1 },
        colors: { ma1: '#F0E68C', ma2: '#FF69B4', ma3: '#1E90FF', boll: '#0000FF' }
      })
    )

    expect(mockUseLineSeries).toHaveBeenCalledTimes(5)
    expect(mockUseLineSeries.mock.calls[0][0]).toMatchObject({
      enabled: true,
      options: expect.objectContaining({ lineWidth: 3 })
    })
    expect(mockUseLineSeries.mock.calls[3][0]).toMatchObject({
      enabled: false,
      options: expect.objectContaining({ lineWidth: 1 })
    })
  })
})
