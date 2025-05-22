import { renderHook, act } from '@testing-library/react'
import useIndicatorChart from '@/hooks/chart/use-indicator-chart'
import { createChart, type IChartApi, type ITimeScaleApi } from 'lightweight-charts'
import type { ChartTheme } from '@/types'

jest.mock('lightweight-charts', () => ({
  createChart: jest.fn(),
  CrosshairMode: { Normal: 0 }
}))

const mockCreate = createChart as jest.Mock

describe('useIndicatorChart', () => {
  it('creates chart and cleans up', () => {
    const remove = jest.fn()
    const chartMock = {
      addLineSeries: jest.fn(() => ({ setData: jest.fn() })),
      timeScale: jest.fn(() => ({
        setVisibleLogicalRange: jest.fn(),
        getVisibleLogicalRange: jest.fn(() => ({ from: 0, to: 1 })),
        subscribeVisibleLogicalRangeChange: jest.fn(),
        unsubscribeVisibleLogicalRangeChange: jest.fn()
      })),
      resize: jest.fn(),
      remove
    }
    mockCreate.mockReturnValue(chartMock)
    const mainChart = {
      timeScale: () => ({
        getVisibleLogicalRange: jest.fn(() => ({ from: 0, to: 1 })),
        subscribeVisibleLogicalRangeChange: jest.fn(),
        unsubscribeVisibleLogicalRangeChange: jest.fn()
      } as unknown as ITimeScaleApi<any>)
    } as unknown as IChartApi

    const colors: ChartTheme = {
      background: '#000',
      text: '#fff',
      grid: '#333',
      crosshair: '#ccc',
      upColor: '#0f0',
      downColor: '#f00',
      volume: '#00f'
    }

    const { result } = renderHook(() =>
      useIndicatorChart({ height: 100, colors, mainChart })
    )
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 200 })

    const addSpy = jest.spyOn(window, 'addEventListener')
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    let cleanup: () => void
    act(() => {
      const { cleanup: c } = result.current(container, {})
      cleanup = c
    })

    expect(mockCreate).toHaveBeenCalled()
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    act(() => cleanup())

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(remove).toHaveBeenCalled()
  })
})
