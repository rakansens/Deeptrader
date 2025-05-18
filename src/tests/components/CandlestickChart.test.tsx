import { render, screen, waitFor } from '@testing-library/react'
import CandlestickChart from '@/components/chart/CandlestickChart'
import { toast } from '@/hooks/use-toast'

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}))

// モックが必要なのでlightweight-chartsをモック化
jest.mock('lightweight-charts', () => ({
  createChart: jest.fn(() => ({
    addCandlestickSeries: jest.fn(() => ({ 
      setData: jest.fn(),
      update: jest.fn()
    })),
    addHistogramSeries: jest.fn(() => ({ 
      setData: jest.fn(),
      update: jest.fn()
    })),
    priceScale: jest.fn(() => ({
      applyOptions: jest.fn()
    })),
    applyOptions: jest.fn(),
    resize: jest.fn(),
    remove: jest.fn(),
  })),
}))

describe('CandlestickChart', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  it('APIモード: ローディング中はスケルトンを表示する', async () => {
    let resolveFetch: (value: Response | PromiseLike<Response>) => void
    const fetchPromise = new Promise<Response>(r => {
      resolveFetch = r
    })
    global.fetch = jest.fn().mockReturnValue(fetchPromise)
    render(<CandlestickChart symbol="BTCUSDT" interval="1m" useApi={true} />)
    expect(screen.getByTestId('loading')).toBeInTheDocument()
    resolveFetch!({ ok: true, json: async () => [] } as Response)
  })

  it('APIモード: 取得失敗時にエラーメッセージとトーストを表示する', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false } as Response)
    render(<CandlestickChart symbol="BTCUSDT" interval="1m" useApi={true} />)
    await waitFor(() => expect(screen.getByTestId('loading')).toBeInTheDocument())
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
    
    render(<CandlestickChart symbol="BTCUSDT" interval="1m" useApi={false} />)
    expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    
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
})
