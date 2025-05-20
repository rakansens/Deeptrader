import { fetchOpenInterest } from '@/infrastructure/open-interest-service';

const originalFetch = global.fetch;

beforeEach(() => {
  if (!global.fetch) {
    (global as any).fetch = jest.fn();
  }
});

describe('fetchOpenInterest', () => {
  const symbol = 'BTCUSDT';

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('fetches open interest data', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            symbol,
            price: '50000',
            sumOpenInterestValue: '1000000',
            timestamp: '1700000000000'
          }
        ]
      })
    } as Response);

    const result = await fetchOpenInterest(symbol);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`symbol=${symbol}`), expect.anything());
    expect(result.symbol).toBe(symbol);
    expect(result.price).toBe(50000);
    expect(result.sumOpenInterestValue).toBe(1000000);
  });

  it('throws error when response is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Error'
    } as Response);

    await expect(fetchOpenInterest(symbol)).rejects.toThrow('Failed to fetch open interest');
  });
});
