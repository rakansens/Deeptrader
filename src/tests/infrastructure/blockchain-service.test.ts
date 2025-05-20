import { getAddressInfo } from '@/infrastructure/blockchain-service';

const originalFetch = global.fetch;

beforeEach(() => {
  if (!global.fetch) {
    (global as any).fetch = jest.fn();
  }
});

describe('getAddressInfo', () => {
  const address = '0xabc';

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('fetches address info and returns parsed result', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          [address]: {
            address: {
              balance: '100',
              transaction_count: 2,
              nonce: 1
            }
          }
        }
      })
    } as Response);

    const result = await getAddressInfo(address);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(address));
    expect(result).toEqual({ address, balance: '100', txCount: 2, nonce: 1 });
  });

  it('throws error when response is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    } as Response);
    await expect(getAddressInfo(address)).rejects.toThrow('Failed to fetch address info');
  });
});
