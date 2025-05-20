import { renderHook } from '@testing-library/react'
import useIndicatorSeries from '@/hooks/use-indicator-series'
import useLineSeries from '@/hooks/use-line-series'

jest.mock('@/hooks/use-line-series')
const mockUseLineSeries = useLineSeries as jest.Mock

describe('useIndicatorSeries', () => {
  it('creates line series based on flags', () => {
    renderHook(() =>
      useIndicatorSeries({
        chart: {} as any,
        maRef: { current: null } as any,
        bollUpperRef: { current: null } as any,
        bollLowerRef: { current: null } as any,
        ma: [],
        bollUpper: [],
        bollLower: [],
        enabledMa: true,
        enabledBoll: false
      })
    )

    expect(mockUseLineSeries).toHaveBeenCalledTimes(3)
    expect(mockUseLineSeries.mock.calls[0][0]).toMatchObject({ enabled: true })
    expect(mockUseLineSeries.mock.calls[1][0]).toMatchObject({ enabled: false })
  })
})
