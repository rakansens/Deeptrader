import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import RsiPanel from '@/components/chart/RsiPanel'
import mockIndicatorPanel from '../utils/mockIndicatorPanel'

jest.mock('lightweight-charts', () => {
  const lineSeriesMocks: any[] = []
  const addLineSeries = jest.fn(() => {
    const obj = { setData: jest.fn() }
    lineSeriesMocks.push(obj)
    return obj
  })
  const createChart = jest.fn(() => ({
    addLineSeries,
    timeScale: () => ({
      setVisibleLogicalRange: jest.fn(),
      subscribeVisibleLogicalRangeChange: jest.fn(),
      unsubscribeVisibleLogicalRangeChange: jest.fn()
    }),
    remove: jest.fn()
  }))
  ;(createChart as any).lineSeriesMocks = lineSeriesMocks
  return {
    createChart,
    CrosshairMode: { Normal: 0 }
  }
})

jest.mock('@/components/chart/IndicatorPanel', () => {
  const factory = require('../utils/mockIndicatorPanel').default
  return factory()
})

describe('RsiPanel', () => {
  it('renders panel element', () => {
    render(<RsiPanel data={[]} chart={null} height={100} />)
    expect(screen.getByTestId('rsi-panel')).toBeInTheDocument()
  })

  it('renders custom threshold lines', async () => {
    const { createChart } = require('lightweight-charts')
    ;(createChart as any).lineSeriesMocks.length = 0
    render(
      <RsiPanel
        data={[]}
        chart={null}
        height={100}
        rsiUpper={80}
        rsiLower={20}
      />
    )
    const lines = (createChart as any).lineSeriesMocks as any[]
    await waitFor(() =>
      expect(lines[1].setData).toHaveBeenCalledWith([
        { time: expect.any(Number), value: 20 },
        { time: expect.any(Number), value: 20 },
      ])
    )
    await waitFor(() =>
      expect(lines[2].setData).toHaveBeenCalledWith([
        { time: expect.any(Number), value: 80 },
        { time: expect.any(Number), value: 80 },
      ])
    )
  })
})
