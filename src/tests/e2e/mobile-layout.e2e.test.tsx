import { render, screen } from '@testing-library/react'
import CandlestickChart from '@/components/chart/CandlestickChart'

jest.mock('lightweight-charts', () => ({
  createChart: jest.fn(() => ({
    addCandlestickSeries: jest.fn(() => ({ setData: jest.fn() })),
    addHistogramSeries: jest.fn(() => ({ setData: jest.fn(), applyOptions: jest.fn() })),
    addLineSeries: jest.fn(() => ({ setData: jest.fn() })),
    priceScale: jest.fn(() => ({ applyOptions: jest.fn() })),
    timeScale: jest.fn(() => ({
      subscribeVisibleLogicalRangeChange: jest.fn(),
      unsubscribeVisibleLogicalRangeChange: jest.fn(),
    })),
    applyOptions: jest.fn(),
    resize: jest.fn(),
    removeSeries: jest.fn(),
    remove: jest.fn(),
  })),
  CrosshairMode: { Normal: 0 },
}))

/**
 * モバイル環境でチャートの高さが縮小されるかを確認
 */
describe('Mobile layout', () => {
  it('calculates height based on window width', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 360 })
    window.dispatchEvent(new Event('resize'))

    render(<CandlestickChart />)
    const container = screen.getByTestId('chart-container') as HTMLDivElement
    expect(container.style.height).toBe('216px')
  })
})
