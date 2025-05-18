import { getTicker } from '@/infrastructure/exchange/bitget-service';

describe('getTicker', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('指定されたシンボルでAPIを呼び出すこと', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ data: { symbol: 'BTCUSDT' } })
    } as Response;

    global.fetch = jest.fn().mockResolvedValue(mockResponse);
    await getTicker('BTCUSDT');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('BTCUSDT')
    );
  });
});
