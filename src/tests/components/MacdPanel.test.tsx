import { render, screen } from '@testing-library/react'
import MacdPanel from '@/components/chart/MacdPanel'

jest.mock('lightweight-charts', () => ({
  createChart: () => ({
    addLineSeries: () => ({ setData: jest.fn() }),
    addHistogramSeries: () => ({ setData: jest.fn() }),
    timeScale: () => ({ setVisibleLogicalRange: jest.fn() }),
    remove: jest.fn()
  }),
  CrosshairMode: { Normal: 0 }
}))

jest.mock('@/components/chart/IndicatorPanel', () => ({
  __esModule: true,
  default: ({ initChart, title }: any) => {
    const ref = { current: document.createElement('div') } as any
    if (initChart) initChart(ref.current)
    return <div data-testid={`${title.toLowerCase()}-panel`} />
  }
}))

describe('MacdPanel', () => {
  it('renders panel element', () => {
    render(<MacdPanel macd={[]} signal={[]} chart={null} height={100} />)
    expect(screen.getByTestId('macd-panel')).toBeInTheDocument()
  })
})
