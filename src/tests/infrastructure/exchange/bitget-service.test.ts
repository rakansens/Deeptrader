import { getTicker } from '@/infrastructure/exchange/bitget-service';
import { SYMBOLS } from '@/constants/chart';

describe('getTicker', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('指定されたシンボルでAPIを呼び出すこと', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ data: { symbol: SYMBOLS[0].value } })
    } as Response;

    global.fetch = jest.fn().mockResolvedValue(mockResponse);
    await getTicker(SYMBOLS[0].value);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(SYMBOLS[0].value)
    );
  });
});
