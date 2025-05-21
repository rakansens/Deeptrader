import { render, screen, waitFor, act } from '@testing-library/react'
import CandlestickChart from '@/components/chart/CandlestickChart'
import { SYMBOLS, TIMEFRAMES, DEFAULT_INDICATOR_SETTINGS } from '@/constants/chart'

jest.mock('lightweight-charts', () => {
  const timeScaleMocks: any[] = []
  const createChart = jest.fn(() => {
    const candlestickSeries = { setData: jest.fn(), update: jest.fn(), applyOptions: jest.fn() }
    const histSeries = { setData: jest.fn(), update: jest.fn(), applyOptions: jest.fn() }
    const timeScale = {
      subscribeVisibleLogicalRangeChange: jest.fn(),
      unsubscribeVisibleLogicalRangeChange: jest.fn(),
      setVisibleLogicalRange: jest.fn(),
      getVisibleLogicalRange: jest.fn(),
    }
    const handlers: any[] = []
    const chart = {
      addCandlestickSeries: jest.fn(() => candlestickSeries),
      addLineSeries: jest.fn(() => ({ setData: jest.fn(), update: jest.fn() })),
      addHistogramSeries: jest.fn(() => histSeries),
      priceScale: jest.fn(() => ({ applyOptions: jest.fn() })),
      timeScale: jest.fn(() => timeScale),
      applyOptions: jest.fn(),
      resize: jest.fn(),
      removeSeries: jest.fn(),
      remove: jest.fn(),
      subscribeCrosshairMove: jest.fn((h) => handlers.push(h)),
      unsubscribeCrosshairMove: jest.fn(),
    }
    ;(chart as any).handlers = handlers
    ;(chart as any).candlestickSeries = candlestickSeries
    ;(chart as any).histSeries = histSeries
    timeScaleMocks.push(timeScale)
    return chart
  })
  ;(createChart as any).timeScaleMocks = timeScaleMocks
  return {
    createChart,
    CrosshairMode: { Normal: 0, Magnet: 1 },
  }
})

describe('CandlestickChart crosshair tooltip', () => {
  beforeEach(() => {
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ clearRect: jest.fn() } as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('shows tooltip on crosshair move', () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] } as Response)
    const mockWebSocket = { close: jest.fn(), onmessage: null as any }
    global.WebSocket = jest.fn(() => mockWebSocket) as any

    const { createChart } = require('lightweight-charts')

    const { container } = render(
      <CandlestickChart
        symbol={SYMBOLS[0].value}
        interval={TIMEFRAMES[0]}
        useApi={false}
        indicatorSettings={DEFAULT_INDICATOR_SETTINGS}
      />,
    )

    const chart = (createChart as jest.Mock).mock.results[0].value
    const subscribe = chart.subscribeCrosshairMove as jest.Mock
    return waitFor(() => {
      expect(subscribe).toHaveBeenCalled()
    }).then(() => {
      const handler = (chart as any).handlers[0]
      const candleSeries = (chart as any).candlestickSeries
      const histSeries = (chart as any).histSeries

      act(() => {
        handler({
          time: 1620000000,
          seriesData: new Map([
            [candleSeries, { open: 100, high: 120, low: 90, close: 110 }],
            [histSeries, { value: 50 }],
          ]),
        })
      })

      expect(screen.getByTestId('crosshair-tooltip')).toBeInTheDocument()
      expect(screen.getByText(/O:100/)).toBeInTheDocument()
      expect(screen.getByText(/C:110/)).toBeInTheDocument()
    })
  })
})
