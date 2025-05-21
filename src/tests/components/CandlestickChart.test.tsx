import { render, screen, waitFor } from '@testing-library/react'
import CandlestickChart from '@/components/chart/CandlestickChart'
import { toast } from '@/hooks/use-toast'
import { SYMBOLS, TIMEFRAMES, DEFAULT_INDICATOR_SETTINGS } from '@/constants/chart'

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}))

// モックが必要なのでlightweight-chartsをモック化
jest.mock('lightweight-charts', () => {
  const timeScaleMocks: any[] = []
  const createChart = jest.fn(() => {
    const timeScale = {
      subscribeVisibleLogicalRangeChange: jest.fn(),
      unsubscribeVisibleLogicalRangeChange: jest.fn(),
      setVisibleLogicalRange: jest.fn(),
      getVisibleLogicalRange: jest.fn()
    }
    timeScaleMocks.push(timeScale)
    return {
      addCandlestickSeries: jest.fn(() => ({
        setData: jest.fn(),
        update: jest.fn(),
        applyOptions: jest.fn()
      })),
      addLineSeries: jest.fn(() => ({
        setData: jest.fn(),
        update: jest.fn()
      })),
      addHistogramSeries: jest.fn(() => ({
        setData: jest.fn(),
        update: jest.fn(),
        applyOptions: jest.fn()
      })),
      priceScale: jest.fn(() => ({
        applyOptions: jest.fn()
      })),
      timeScale: jest.fn(() => timeScale),
      applyOptions: jest.fn(),
      resize: jest.fn(),
      removeSeries: jest.fn(),
      remove: jest.fn()
    }
  })
  // timeScaleMocksをテストから参照できるように付与
  ;(createChart as any).timeScaleMocks = timeScaleMocks
  return {
    createChart,
    CrosshairMode: { Normal: 0, Magnet: 1 }
  }
})

describe('CandlestickChart', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ clearRect: jest.fn() } as any)
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('APIモード: ローディング中はスケルトンを表示する', async () => {
    let resolveFetch: (value: Response | PromiseLike<Response>) => void
    const fetchPromise = new Promise<Response>(r => {
      resolveFetch = r
    })
    global.fetch = jest.fn().mockReturnValue(fetchPromise)
    render(
      <CandlestickChart
        symbol={SYMBOLS[0].value}
        interval={TIMEFRAMES[0]}
        useApi={true}
        indicatorSettings={DEFAULT_INDICATOR_SETTINGS}
      />
    )
    expect(screen.getByTestId('loading')).toBeInTheDocument()
    resolveFetch!({ ok: true, json: async () => [] } as Response)
    // スケルトンが消えるまで待機
    await waitFor(() =>
      expect(screen.queryByTestId('loading')).toBeNull()
    )
    expect(screen.getByTestId('chart-container')).toBeInTheDocument()
  })

  it('APIモード: 取得失敗時にエラーメッセージとトーストを表示する', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500, statusText: 'server' } as Response)

    render(
      <CandlestickChart
        symbol={SYMBOLS[0].value}
        interval={TIMEFRAMES[0]}
        useApi={true}
        indicatorSettings={DEFAULT_INDICATOR_SETTINGS}
      />
    )

    await waitFor(() =>
      expect(screen.getByTestId('error')).toBeInTheDocument()
    )
    expect(toast).toHaveBeenCalled()
  })

  it('直接モード: チャートコンテナが表示される', async () => {
    global.fetch = jest.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => [[1625097600000, "35000", "36000", "34500", "35500", "1000", 1625184000000, "35500000", 1000, "500", "17750000", "0"]] 
    } as Response)
    
    // WebSocketのモック
    const mockWebSocket = {
      close: jest.fn(),
      onmessage: null as any
    }
    global.WebSocket = jest.fn(() => mockWebSocket) as any
    
    render(
      <CandlestickChart
        symbol={SYMBOLS[0].value}
        interval={TIMEFRAMES[0]}
        useApi={false}
        indicatorSettings={DEFAULT_INDICATOR_SETTINGS}
      />
    )
    expect(screen.getByTestId('chart-container')).toBeInTheDocument()

    const { createChart, CrosshairMode } = require('lightweight-charts')
    const options = (createChart as jest.Mock).mock.calls[0][1]
    expect(options.crosshair.mode).toBe(CrosshairMode.Normal)
    expect(options.grid.vertLines.color).toBeDefined()
    expect(options.rightPriceScale.borderVisible).toBe(true)
    
    // WebSocketメッセージのシミュレーション
    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage({
        data: JSON.stringify({
          k: {
            t: 1625097600000,
            o: "35000",
            h: "36000",
            l: "34500",
            c: "35500",
            v: "1000"
          }
        })
      })
    }
    
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  it('RSI/MACD パネルの表示切り替え', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    const mockWebSocket = {
      close: jest.fn(),
      onmessage: null as any,
    }
    global.WebSocket = jest.fn(() => mockWebSocket) as any

    const { rerender } = render(
      <CandlestickChart
        symbol={SYMBOLS[0].value}
        interval={TIMEFRAMES[0]}
        useApi={false}
        indicators={{ ma: false, rsi: true, macd: false, boll: false }}
        indicatorSettings={DEFAULT_INDICATOR_SETTINGS}
      />
    )

    expect(screen.getByTestId('rsi-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('macd-panel')).toBeNull()

    rerender(
      <CandlestickChart
        symbol={SYMBOLS[0].value}
        interval={TIMEFRAMES[0]}
        useApi={false}
        indicators={{ ma: false, rsi: false, macd: true, boll: false }}
        indicatorSettings={DEFAULT_INDICATOR_SETTINGS}
      />
    )

    expect(screen.queryByTestId('rsi-panel')).toBeNull()
    expect(screen.getByTestId('macd-panel')).toBeInTheDocument()
  })

  it('メインチャートの範囲変更でインジケータ範囲が更新される', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    const mockWebSocket = {
      close: jest.fn(),
      onmessage: null as any,
    }
    global.WebSocket = jest.fn(() => mockWebSocket) as any

    const { rerender } = render(
      <CandlestickChart
        symbol={SYMBOLS[0].value}
        interval={TIMEFRAMES[0]}
        useApi={false}
        indicators={{ ma: false, rsi: false, macd: false, boll: false }}
        indicatorSettings={DEFAULT_INDICATOR_SETTINGS}
      />
    )

    const { createChart } = require('lightweight-charts')

    await waitFor(() => expect((createChart as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1))

    const timeScales = (createChart as any).timeScaleMocks as any[]
    const mainScale = timeScales[0]
    let handler: any
    mainScale.subscribeVisibleLogicalRangeChange.mockImplementation((fn: any) => {
      handler = fn
    })

    rerender(
      <CandlestickChart
        symbol={SYMBOLS[0].value}
        interval={TIMEFRAMES[0]}
        useApi={false}
        indicators={{ ma: false, rsi: true, macd: false, boll: false }}
        indicatorSettings={DEFAULT_INDICATOR_SETTINGS}
      />
    )

    await waitFor(() => expect((createChart as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2))

    expect(timeScales.length).toBeGreaterThanOrEqual(2)
    const subScale = timeScales[1]

    const range = { from: 1, to: 2 }
    mainScale.getVisibleLogicalRange.mockReturnValue(range)

    const callback = mainScale.subscribeVisibleLogicalRangeChange.mock.calls[0]?.[0]
    if (callback) {
      callback(range)
    }

    expect(subScale.setVisibleLogicalRange).toHaveBeenCalledWith(range)
  })
})
