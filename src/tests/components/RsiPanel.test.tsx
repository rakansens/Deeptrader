import { render, screen } from '@testing-library/react'
import RsiPanel from '@/components/chart/RsiPanel'

jest.mock('lightweight-charts', () => ({
  createChart: () => ({
    addLineSeries: () => ({ setData: jest.fn() }),
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

describe('RsiPanel', () => {
  it('renders panel element', () => {
    render(<RsiPanel data={[]} chart={null} height={100} />)
    expect(screen.getByTestId('rsi-panel')).toBeInTheDocument()
  })

  it('subscribes to logical range changes', () => {
    const subscribe = jest.fn()
    const unsubscribe = jest.fn()
    const chart = {
      timeScale: () => ({
        subscribeVisibleLogicalRangeChange: subscribe,
        unsubscribeVisibleLogicalRangeChange: unsubscribe
      })
    } as any
    render(<RsiPanel data={[]} chart={chart} height={100} />)
    expect(subscribe).toHaveBeenCalled()
  })
})
