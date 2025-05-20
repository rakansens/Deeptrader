import { fetchOrderBook } from '@/infrastructure/exchange/binance-service'

const originalFetch = global.fetch

beforeEach(() => {
  if (!global.fetch) {
    ;(global as any).fetch = jest.fn()
  }
})

describe('fetchOrderBook', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    global.fetch = originalFetch
  })

  it('calls Binance depth API and returns parsed data', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ bids: [['1', '2']], asks: [['1.1', '3']] })
    } as Response)

    const result = await fetchOrderBook('BTCUSDT', 5)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('depth'))
    expect(result.bids[0]).toEqual({ price: 1, quantity: 2 })
    expect(result.asks[0]).toEqual({ price: 1.1, quantity: 3 })
  })

  it('throws error when response not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'server'
    } as Response)

    await expect(fetchOrderBook('BTCUSDT')).rejects.toThrow('Failed to fetch order book')
  })
})

