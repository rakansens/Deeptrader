import { fetchSentiment } from '@/infrastructure/sentiment-service';

const originalFetch = global.fetch;

beforeEach(() => {
  if (!global.fetch) {
    (global as any).fetch = jest.fn();
  }
});

describe('fetchSentiment', () => {
  const symbol = 'BTCUSDT';

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('fetches sentiment metrics', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            value: '80',
            value_classification: 'Greed',
            timestamp: '1700000000'
          }
        ]
      })
    } as Response);

    const result = await fetchSentiment(symbol);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`symbol=${symbol}`));
    expect(result.score).toBe(80);
    expect(result.valueText).toBe('Greed');
  });

  it('throws error when response is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Error'
    } as Response);

    await expect(fetchSentiment(symbol)).rejects.toThrow('Failed to fetch sentiment');
  });
});
