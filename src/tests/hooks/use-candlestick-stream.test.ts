import { renderHook, waitFor } from '@testing-library/react'
import useCandlestickStream from '@/hooks/chart/use-candlestick-stream'
import { socketHub } from '@/lib/binance-socket-manager'

jest.mock('@/lib/binance-socket-manager')
const mockSubscribe = socketHub.subscribe as jest.Mock

const sampleKline = [[0, '1', '2', '0', '1', '100']]

describe('useCandlestickStream', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleKline
    }) as any
    mockSubscribe.mockReturnValue({ ws: { addEventListener: jest.fn(), removeEventListener: jest.fn(), readyState: 1 }, unsubscribe: jest.fn() })
    localStorage.clear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('loads cached data when symbol changes', async () => {
    localStorage.setItem(
      'candles_ETHUSDT_1m',
      JSON.stringify([{ time: 0, open: 2, high: 3, low: 1, close: 2 }])
    )
    localStorage.setItem(
      'volumes_ETHUSDT_1m',
      JSON.stringify([{ time: 0, value: 10, color: '#26a69a' }])
    )

    let resolveFetch: (v: unknown) => void = () => {}
    ;(global.fetch as jest.Mock).mockReturnValue(
      new Promise((r) => {
        resolveFetch = r
      })
    )

    const { result, rerender } = renderHook(
      ({ symbol }) => useCandlestickStream(symbol as any, '1m' as any),
      { initialProps: { symbol: 'BTCUSDT' } }
    )

    await waitFor(() => !result.current.loading)
    expect(global.fetch).toHaveBeenCalledTimes(1)

    rerender({ symbol: 'ETHUSDT' })

    await waitFor(() => result.current.candles[0]?.open === 2)
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain('ETHUSDT')

    resolveFetch({ ok: true, json: async () => sampleKline })
  })
})

