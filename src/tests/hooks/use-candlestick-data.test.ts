import { renderHook, act, waitFor } from '@testing-library/react'
import useCandlestickData from '@/hooks/chart/use-candlestick-data'
import { socketHub } from '@/lib/binance-socket-manager'

jest.mock('@/lib/binance-socket-manager')
const mockSubscribe = socketHub.subscribe as jest.Mock

const sampleKline = [[0, '1', '2', '0', '1', '100']]

describe('useCandlestickData', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleKline
    }) as unknown as typeof fetch
    mockSubscribe.mockReturnValue({ ws: { addEventListener: jest.fn(), removeEventListener: jest.fn(), readyState: 1 }, unsubscribe: jest.fn() })
    localStorage.clear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('loads data and handles websocket message', async () => {
    const { result } = renderHook(() =>
      useCandlestickData('BTCUSDT', '1m')
    )

    await waitFor(() => mockSubscribe.mock.calls.length > 0)
    expect(global.fetch).toHaveBeenCalled()

    const msg = { k: { t: 60000, o: '1', h: '2', l: '0', c: '1', v: '50' } }
    act(() => {
      mockSubscribe.mock.calls[0][1](msg)
    })
    expect(result.current.candles.length).toBeGreaterThan(0)
    expect(result.current.connected).toBe(true)
  })
})

