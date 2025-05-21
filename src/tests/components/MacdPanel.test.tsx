import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MacdPanel from '@/components/chart/MacdPanel'
import mockIndicatorPanel from '../utils/mockIndicatorPanel'

jest.mock('lightweight-charts', () => {
  const createChart = jest.fn(() => ({
    addLineSeries: () => ({ setData: jest.fn() }),
    addHistogramSeries: () => ({ setData: jest.fn() }),
    timeScale: () => ({
      setVisibleLogicalRange: jest.fn(),
      subscribeVisibleLogicalRangeChange: jest.fn(),
      unsubscribeVisibleLogicalRangeChange: jest.fn()
    }),
    remove: jest.fn()
  }))
  return {
    createChart,
    CrosshairMode: { Normal: 0 }
  }
})

jest.mock('@/components/chart/IndicatorPanel', () => {
  const factory = require('../utils/mockIndicatorPanel').default
  return factory()
})

describe('MacdPanel', () => {
  it('renders panel element', () => {
    render(<MacdPanel macd={[]} signal={[]} histogram={[]} chart={null} height={100} />)
    expect(screen.getByTestId('macd-panel')).toBeInTheDocument()
  })

  it('recreates chart when chart prop changes', async () => {
    const { createChart } = require('lightweight-charts')
    ;(createChart as jest.Mock).mockClear()
    const chart1 = {
      timeScale: () => ({
        setVisibleLogicalRange: jest.fn(),
        subscribeVisibleLogicalRangeChange: jest.fn(),
        unsubscribeVisibleLogicalRangeChange: jest.fn(),
      }),
    }
    const { rerender } = render(
      <MacdPanel macd={[]} signal={[]} histogram={[]} chart={chart1 as any} height={100} />
    )
    await waitFor(() => expect(createChart).toHaveBeenCalledTimes(1))

    const chart2 = {
      timeScale: () => ({
        setVisibleLogicalRange: jest.fn(),
        subscribeVisibleLogicalRangeChange: jest.fn(),
        unsubscribeVisibleLogicalRangeChange: jest.fn(),
      }),
    }
    rerender(
      <MacdPanel macd={[]} signal={[]} histogram={[]} chart={chart2 as any} height={100} />
    )

    await waitFor(() => expect(createChart).toHaveBeenCalledTimes(2))
  })
})
