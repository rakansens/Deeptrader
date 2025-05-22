import { act, waitFor } from '@testing-library/react'
import { renderHookWithQueryClient } from '../utils/renderWithQueryClient'
import useOrderBook, { UseOrderBookResult } from '@/hooks/chart/use-order-book'
import { socketHub } from '@/lib/binance-socket-manager'
import { fetchOrderBook } from '@/infrastructure/exchange/binance-service'

jest.mock('@/lib/binance-socket-manager')
jest.mock('@/infrastructure/exchange/binance-service')

const mockSubscribe = socketHub.subscribe as jest.Mock
const mockFetch = fetchOrderBook as jest.Mock

describe('useOrderBook', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ bids: [{ price: 1, quantity: 2 }], asks: [{ price: 1.1, quantity: 3 }] })
    mockSubscribe.mockReturnValue({ ws: { addEventListener: jest.fn(), removeEventListener: jest.fn(), readyState: 1 }, unsubscribe: jest.fn() })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('loads snapshot and handles websocket update', async () => {
    const { result } = renderHookWithQueryClient(() => useOrderBook('BTCUSDT'))
    const orderBook = result as { current: UseOrderBookResult }

    await waitFor(() => mockFetch.mock.calls.length > 0)
    await waitFor(() => orderBook.current.bids.length > 0)
    expect(orderBook.current.bids.length).toBe(1)
    expect(orderBook.current.connected).toBe(true)

    const msg = { b: [['1', '3']], a: [['1.1', '0']] }
    act(() => {
      mockSubscribe.mock.calls[0][1](msg)
    })

    expect(orderBook.current.bids[0].quantity).toBe(3)
    expect(orderBook.current.asks.length).toBe(0)
  })
})

