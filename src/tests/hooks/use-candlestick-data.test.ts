import { renderHook, act, waitFor } from '@testing-library/react'
import useCandlestickData from '@/hooks/chart/use-candlestick-data'
import useBinanceSocket from '@/hooks/chart/use-binance-socket'

jest.mock('@/hooks/chart/use-binance-socket')
const mockUseBinanceSocket = useBinanceSocket as jest.Mock

const sampleKline = [[0, '1', '2', '0', '1', '100']]

describe('useCandlestickData', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleKline
    }) as any
    mockUseBinanceSocket.mockReturnValue({ status: 'connected' })
    localStorage.clear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('loads data and handles websocket message', async () => {
    const { result } = renderHook(() =>
      useCandlestickData('BTCUSDT' as any, '1m' as any)
    )

    await waitFor(() => mockUseBinanceSocket.mock.calls.length > 0)
    expect(mockUseBinanceSocket.mock.calls[0][0].pingInterval).toBe(0)
    expect(global.fetch).toHaveBeenCalled()

    const msg = { k: { t: 60000, o: '1', h: '2', l: '0', c: '1', v: '50' } }
    act(() => {
      mockUseBinanceSocket.mock.calls[0][0].onMessage!(msg)
    })
    expect(result.current.candles.length).toBeGreaterThan(0)
    expect(result.current.connected).toBe(true)
  })
})
