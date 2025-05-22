import { renderHook, act, waitFor } from '@testing-library/react';
import { useCandlestickData } from '@/hooks/chart/use-candlestick-data';
import { socketHub } from '@/lib/binance-socket-manager';
import type { BinanceKlineMessage } from '@/types';

jest.mock('@/lib/binance-socket-manager');
const mockSubscribe = socketHub.subscribe as jest.Mock;

describe('useCandlestickData (integration)', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [[0, '1', '2', '0', '1', '100']],
    }) as unknown as typeof fetch;
    mockSubscribe.mockReturnValue({ ws: { addEventListener: jest.fn(), removeEventListener: jest.fn(), readyState: 1 }, unsubscribe: jest.fn() });
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches data and processes websocket updates', async () => {
    const { result } = renderHook(() =>
      useCandlestickData('BTCUSDT', '1m'),
    );

    await waitFor(() => mockSubscribe.mock.calls.length > 0);
    expect(global.fetch).toHaveBeenCalled();

    const msg: BinanceKlineMessage = {
      e: 'kline',
      E: 0,
      s: 'BTCUSDT',
      k: {
        t: 60_000,
        T: 60_000,
        s: 'BTCUSDT',
        i: '1m',
        f: 0,
        L: 0,
        o: '1',
        c: '1',
        h: '1',
        l: '1',
        v: '10',
        n: 1,
        x: false,
        q: '10',
        V: '5',
        Q: '5',
        B: '0',
      },
    };

    act(() => {
      mockSubscribe.mock.calls[0][1](msg);
    });

    expect(result.current.candles.length).toBeGreaterThan(0);
    expect(result.current.ma1.length).toBeGreaterThan(0);
  });
});

