import { renderHook, act, waitFor } from '@testing-library/react'
import useOrderBook from '@/hooks/use-order-book'
import useBinanceSocket from '@/hooks/use-binance-socket'
import { fetchOrderBook } from '@/infrastructure/exchange/binance-service'

jest.mock('@/hooks/use-binance-socket')
jest.mock('@/infrastructure/exchange/binance-service')

const mockSocket = useBinanceSocket as jest.Mock
const mockFetch = fetchOrderBook as jest.Mock

describe('useOrderBook', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ bids: [{ price: 1, quantity: 2 }], asks: [{ price: 1.1, quantity: 3 }] })
    mockSocket.mockReturnValue({ status: 'connected' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('loads snapshot and handles websocket update', async () => {
    const { result } = renderHook(() => useOrderBook('BTCUSDT'))

    await waitFor(() => mockFetch.mock.calls.length > 0)
    expect(result.current.bids.length).toBe(1)
    expect(result.current.connected).toBe(true)

    const msg = { b: [['1', '3']], a: [['1.1', '0']] }
    act(() => {
      mockSocket.mock.calls[0][0].onMessage!(msg)
    })

    expect(result.current.bids[0].quantity).toBe(3)
    expect(result.current.asks.length).toBe(0)
  })
})

