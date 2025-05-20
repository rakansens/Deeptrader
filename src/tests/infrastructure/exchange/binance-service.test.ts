import { fetchKlines } from '@/infrastructure/exchange/binance-service';

const originalFetch = global.fetch;

beforeEach(() => {
  if (!global.fetch) {
    // jsdom環境ではfetchが未定義の可能性があるためダミーを設定
    (global as any).fetch = jest.fn();
  }
});

describe('fetchKlines', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('calls Binance API and returns data', async () => {
    const mockData = [["1"]] as any;
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockData
    } as Response);

    const result = await fetchKlines('BTCUSDT', '1h', 10);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('klines'));
    expect(result).toEqual(mockData);
  });

  it('throws error when response is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Error'
    } as Response);

    await expect(fetchKlines('BTCUSDT', '1h')).rejects.toThrow('Failed to fetch klines');
  });
});
