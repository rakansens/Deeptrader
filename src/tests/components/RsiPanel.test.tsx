import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import RsiPanel from '@/components/chart/RsiPanel'
import mockIndicatorPanel from '../utils/mockIndicatorPanel'

jest.mock('lightweight-charts', () => ({
  createChart: () => ({
    addLineSeries: () => ({ setData: jest.fn() }),
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

describe('RsiPanel', () => {
  it('renders panel element', () => {
    render(<RsiPanel data={[]} chart={null} height={100} />)
    expect(screen.getByTestId('rsi-panel')).toBeInTheDocument()
  })
})
