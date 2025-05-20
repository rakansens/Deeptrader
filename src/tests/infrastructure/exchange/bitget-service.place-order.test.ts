import { placeOrder } from '@/infrastructure/exchange/bitget-service';

const originalFetch = global.fetch;

beforeEach(() => {
  if (!global.fetch) {
    (global as any).fetch = jest.fn();
  }
});

const request = {
  symbol: 'BTCUSDT',
  side: 'buy',
  type: 'limit',
  quantity: 1,
  price: 100
} as any;

describe('placeOrder', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('sends POST request to Bitget', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
    await placeOrder(request);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('place-order'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws error when API response is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request'
    } as Response);
    await expect(placeOrder(request)).rejects.toThrow('Order failed');
  });
});
