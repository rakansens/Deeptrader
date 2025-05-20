import { renderHook, act } from '@testing-library/react'
import { useIndicatorChart, useChart } from '@/hooks/use-chart'
import { createChart } from 'lightweight-charts'
import useChartTheme from '@/hooks/use-chart-theme'

jest.mock('lightweight-charts', () => ({
  createChart: jest.fn(),
  CrosshairMode: { Normal: 0 }
}))
jest.mock('@/hooks/use-chart-theme', () => jest.fn(() => ({
  background: '#000',
  text: '#fff',
  grid: '#333',
  crosshair: '#fff',
  upColor: '#0f0',
  downColor: '#f00',
  volume: '#00f'
})))

const mockCreate = createChart as jest.Mock

describe('useIndicatorChart', () => {
  it('creates chart and cleans up', () => {
    const remove = jest.fn()
    const resize = jest.fn()
    const chartMock = {
      timeScale: jest.fn(() => ({
        getVisibleLogicalRange: jest.fn(() => ({ from: 0, to: 1 })),
        setVisibleLogicalRange: jest.fn(),
        subscribeVisibleLogicalRangeChange: jest.fn()
      })),
      resize,
      remove
    }
    mockCreate.mockReturnValue(chartMock)
    const mainChart = {
      timeScale: () => ({
        getVisibleLogicalRange: jest.fn(() => ({ from: 0, to: 1 })),
        subscribeVisibleLogicalRangeChange: jest.fn(),
        unsubscribeVisibleLogicalRangeChange: jest.fn()
      })
    } as any

    const { result } = renderHook(() => useIndicatorChart({ height: 100, mainChart }))
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 200 })

    const addSpy = jest.spyOn(window, 'addEventListener')
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    let cleanup: () => void
    act(() => {
      const ret = result.current(container)
      cleanup = ret.cleanup
    })

    expect(mockCreate).toHaveBeenCalled()
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    act(() => cleanup())

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(remove).toHaveBeenCalled()
  })
})

describe('useChart', () => {
  it('returns colors from theme', () => {
    const { result } = renderHook(() => useChart())
    expect(result.current.colors.background).toBe('#000')
  })
})
