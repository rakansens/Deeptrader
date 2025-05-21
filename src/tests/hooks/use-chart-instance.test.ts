import { renderHook } from '@testing-library/react'
import useChartInstance from '@/hooks/chart/use-chart-instance'
import { createChart } from 'lightweight-charts'
import useChartTheme from '@/hooks/chart/use-chart-theme'

jest.mock('lightweight-charts', () => ({
  createChart: jest.fn(),
  CrosshairMode: { Normal: 0 }
}))
jest.mock('@/hooks/chart/use-chart-theme', () => jest.fn(() => ({
  background: '#000',
  text: '#fff',
  grid: '#333',
  crosshair: '#fff',
  upColor: '#0f0',
  downColor: '#f00',
  volume: '#00f'
})))

const mockCreate = createChart as jest.Mock

describe('useChartInstance', () => {
  it('creates chart and cleans up on unmount', () => {
    const remove = jest.fn()
    const resize = jest.fn()
    const applyOptions = jest.fn()
    const chartMock = {
      resize,
      remove,
      applyOptions,
      timeScale: jest.fn(() => ({}))
    }
    mockCreate.mockReturnValue(chartMock)

    const container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 300 })
    const addSpy = jest.spyOn(window, 'addEventListener')
    const removeSpy = jest.spyOn(window, 'removeEventListener')

    const { result, unmount } = renderHook(() =>
      useChartInstance({ container, height: 200 })
    )

    expect(mockCreate).toHaveBeenCalled()
    expect(result.current.current).toBe(chartMock)
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(remove).toHaveBeenCalled()
  })
})
