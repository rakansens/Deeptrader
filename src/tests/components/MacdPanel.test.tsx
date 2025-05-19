import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import MacdPanel from '@/components/chart/MacdPanel'
import mockIndicatorPanel from '../utils/mockIndicatorPanel'

jest.mock('lightweight-charts', () => ({
  createChart: () => ({
    addLineSeries: () => ({ setData: jest.fn() }),
    addHistogramSeries: () => ({ setData: jest.fn() }),
    timeScale: () => ({
      setVisibleLogicalRange: jest.fn(),
      subscribeVisibleLogicalRangeChange: jest.fn(),
      unsubscribeVisibleLogicalRangeChange: jest.fn()
    }),
    remove: jest.fn()
  }),
  CrosshairMode: { Normal: 0 }
}))

jest.mock('@/components/chart/IndicatorPanel', () => {
  const factory = require('../utils/mockIndicatorPanel').default
  return factory()
})

describe('MacdPanel', () => {
  it('renders panel element', () => {
    render(<MacdPanel macd={[]} signal={[]} chart={null} height={100} />)
    expect(screen.getByTestId('macd-panel')).toBeInTheDocument()
  })
})
