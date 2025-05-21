import { renderHook, act, waitFor } from '@testing-library/react';
import { useCandlestickData } from './use-candlestick-data';
import { 
  SMACalculator, 
  EMACalculator, 
  RsiCalculator, 
  MACDCalculator, 
  BollingerBandsCalculator 
} from '@/lib/indicators';
import type { BinanceKline, BinanceKlineMessage } from '@/types';
import type { IndicatorSettings, SymbolValue, Timeframe } from '@/constants/chart';
import { DEFAULT_INDICATOR_SETTINGS, TIMEFRAMES, SYMBOLS } from '@/constants/chart';
import { UTCTimestamp } from 'lightweight-charts';

// Mock dependencies
const mockSmaSeed = jest.fn();
const mockSmaUpdate = jest.fn().mockReturnValue(10);
const mockSmaGetResult = jest.fn().mockReturnValue(10);
const mockRsiSeed = jest.fn();
const mockRsiUpdate = jest.fn().mockReturnValue(50);
const mockRsiGetResult = jest.fn().mockReturnValue(50);
const mockMacdSeed = jest.fn();
const mockMacdUpdate = jest.fn().mockReturnValue({ macd: 1, signal: 0.5, histogram: 0.5 });
const mockMacdGetResult = jest.fn().mockReturnValue({ macd: 1, signal: 0.5, histogram: 0.5 });
const mockBollSeed = jest.fn();
const mockBollUpdate = jest.fn().mockReturnValue({ upper: 12, middle: 10, lower: 8 });
const mockBollGetResult = jest.fn().mockReturnValue({ upper: 12, middle: 10, lower: 8 });

jest.mock('@/lib/indicators', () => ({
  SMACalculator: jest.fn().mockImplementation(() => ({
    seed: mockSmaSeed,
    update: mockSmaUpdate,
    getResult: mockSmaGetResult,
  })),
  EMACalculator: jest.fn().mockImplementation(() => ({ 
    seed: jest.fn(),
    update: jest.fn().mockReturnValue(null),
    getResult: jest.fn().mockReturnValue(null),
  })),
  RsiCalculator: jest.fn().mockImplementation(() => ({
    seed: mockRsiSeed,
    update: mockRsiUpdate,
    getResult: mockRsiGetResult,
  })),
  MACDCalculator: jest.fn().mockImplementation(() => ({
    seed: mockMacdSeed,
    update: mockMacdUpdate,
    getResult: mockMacdGetResult,
  })),
  BollingerBandsCalculator: jest.fn().mockImplementation(() => ({
    seed: mockBollSeed,
    update: mockBollUpdate,
    getResult: mockBollGetResult,
  })),
}));

// Mock useBinanceSocket
let mockOnMessageHandler: ((message: BinanceKlineMessage) => void) | null = null;
const mockUseBinanceSocket = jest.fn(({ onMessage, enabled }) => {
  mockOnMessageHandler = onMessage; 
  return {
    status: enabled ? 'connected' : 'disconnected',
    lastMessage: null, 
  };
});
jest.mock('./use-binance-socket', () => ({
  __esModule: true,
  default: mockUseBinanceSocket,
}));


// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock global fetch
global.fetch = jest.fn();

const mockSymbol: SymbolValue = SYMBOLS[0].value; 
const mockInterval: Timeframe = TIMEFRAMES[0]; 
const initialMockSettings: IndicatorSettings = { ...DEFAULT_INDICATOR_SETTINGS };


// Helper to create mock kline data
const createMockKline = (time: number, close: number, open = 10, high = 15, low = 5, volume = 100): BinanceKline => [
  time * 1000, open.toString(), high.toString(), low.toString(), close.toString(), volume.toString(),
  (time + 60) * 1000 -1, "1000.0", 10, "500.0", "500.0", "0"
];

describe('useCandlestickData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    (fetch as jest.Mock).mockReset();
    mockOnMessageHandler = null; 

    // Reset mock implementations for calculators to default for each test if needed
    // This is important because the mock constructor is called in the hook's scope
    (SMACalculator as jest.Mock).mockImplementation(() => ({ seed: mockSmaSeed, update: mockSmaUpdate, getResult: mockSmaGetResult }));
    (RsiCalculator as jest.Mock).mockImplementation(() => ({ seed: mockRsiSeed, update: mockRsiUpdate, getResult: mockRsiGetResult }));
    (MACDCalculator as jest.Mock).mockImplementation(() => ({ seed: mockMacdSeed, update: mockMacdUpdate, getResult: mockMacdGetResult }));
    (BollingerBandsCalculator as jest.Mock).mockImplementation(() => ({ seed: mockBollSeed, update: mockBollUpdate, getResult: mockBollGetResult }));

  });

  describe('Initial Data Load', () => {
    it('should fetch initial data, seed calculators, and populate chartData', async () => {
      const mockKlines: BinanceKline[] = [
        createMockKline(Date.now()/1000 - 120, 100),
        createMockKline(Date.now()/1000 - 60, 101),
        createMockKline(Date.now()/1000, 102),
      ];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockKlines,
      });

      const { result } = renderHook(() => useCandlestickData(mockSymbol, mockInterval, initialMockSettings));

      expect(result.current.loading).toBe(true);
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`https://api.binance.com/api/v3/klines?symbol=${mockSymbol}&interval=${mockInterval}&limit=500`, {"signal": expect.any(AbortSignal)});
      
      expect(SMACalculator).toHaveBeenCalledWith(initialMockSettings.sma);
      expect(RsiCalculator).toHaveBeenCalledWith(initialMockSettings.rsi);
      expect(MACDCalculator).toHaveBeenCalledWith(initialMockSettings.macd.short, initialMockSettings.macd.long, initialMockSettings.macd.signal);
      expect(BollingerBandsCalculator).toHaveBeenCalledWith(initialMockSettings.boll.period, initialMockSettings.boll.stdDev);

      const expectedPrices = mockKlines.map(k => parseFloat(k[4]));
      expect(mockSmaSeed).toHaveBeenCalledWith(expectedPrices);
      expect(mockRsiSeed).toHaveBeenCalledWith(expectedPrices);
      expect(mockMacdSeed).toHaveBeenCalledWith(expectedPrices);
      expect(mockBollSeed).toHaveBeenCalledWith(expectedPrices);
      
      expect(result.current.candles.length).toBe(mockKlines.length);
      expect(result.current.candles[0].close).toBe(parseFloat(mockKlines[0][4]));
      expect(result.current.volumes.length).toBe(mockKlines.length);
      
      expect(result.current.ma.length).toBeGreaterThan(0);
      expect(result.current.rsi.length).toBeGreaterThan(0);
      expect(result.current.macd.length).toBeGreaterThan(0);
      expect(result.current.bollUpper.length).toBeGreaterThan(0);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(`candles_${mockSymbol}_${mockInterval}`, JSON.stringify(result.current.candles));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(`volumes_${mockSymbol}_${mockInterval}`, JSON.stringify(result.current.volumes));
    });

    it('should load data from localStorage if available', async () => {
      const cachedCandles = [{ time: 1600000000 as UTCTimestamp, open: 1, high: 2, low: 0, close: 1.5 }];
      const cachedVolumes = [{ time: 1600000000 as UTCTimestamp, value: 100, color: 'red' }];
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === `candles_${mockSymbol}_${mockInterval}`) return JSON.stringify(cachedCandles);
        if (key === `volumes_${mockSymbol}_${mockInterval}`) return JSON.stringify(cachedVolumes);
        return null;
      });

       const mockKlines: BinanceKline[] = [createMockKline(Date.now()/1000, 102)];
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockKlines });

      const { result } = renderHook(() => useCandlestickData(mockSymbol, mockInterval, initialMockSettings));
      
      expect(result.current.candles).toEqual(cachedCandles);
      expect(result.current.volumes).toEqual(cachedVolumes);
      
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.candles.length).toBe(mockKlines.length);
    });

    it('should handle fetch error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const { result } = renderHook(() => useCandlestickData(mockSymbol, mockInterval, initialMockSettings));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('WebSocket Updates', () => {
    const initialKlines: BinanceKline[] = [
        createMockKline(Date.now()/1000 - 120, 100),
        createMockKline(Date.now()/1000 - 60, 101),
    ];
    
    beforeEach(() => {
        (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => initialKlines });
    });

    it('should update chartData on incoming WebSocket message', async () => {
      const { result } = renderHook(() => useCandlestickData(mockSymbol, mockInterval, initialMockSettings));
      await waitFor(() => expect(result.current.loading).toBe(false)); 

      const initialCandleCount = result.current.candles.length;
      
      const newMessageTime = (Date.now()/1000) as UTCTimestamp;
      const newKlineMessage: BinanceKlineMessage = {
        e: "kline", E: Date.now(), s: mockSymbol,
        k: {
          t: newMessageTime * 1000, T: (newMessageTime + 59) * 1000, s: mockSymbol, i: mockInterval,
          f: 100, L: 200, o: "101.5", c: "102.5", h: "103", l: "101", v: "1000", n: 100,
          x: false, q: "102000", V: "500", Q: "51000", B: "0"
        }
      };

      act(() => {
        if (mockOnMessageHandler) mockOnMessageHandler(newKlineMessage);
      });
      
      expect(mockSmaUpdate).toHaveBeenCalledWith(parseFloat(newKlineMessage.k.c));
      expect(mockRsiUpdate).toHaveBeenCalledWith(parseFloat(newKlineMessage.k.c));
      expect(mockMacdUpdate).toHaveBeenCalledWith(parseFloat(newKlineMessage.k.c));
      expect(mockBollUpdate).toHaveBeenCalledWith(parseFloat(newKlineMessage.k.c));

      expect(result.current.candles.length).toBe(initialCandleCount + 1);
      expect(result.current.candles[result.current.candles.length - 1].close).toBe(parseFloat(newKlineMessage.k.c));
      
      expect(result.current.ma.length).toBeGreaterThan(0);
      expect(result.current.ma[result.current.ma.length -1].value).toBe(10); 
      expect(result.current.rsi[result.current.rsi.length -1].value).toBe(50); 
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(`candles_${mockSymbol}_${mockInterval}`, JSON.stringify(result.current.candles));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(`volumes_${mockSymbol}_${mockInterval}`, JSON.stringify(result.current.volumes));
    });
  });

  describe('Settings Changes', () => {
    it('should re-initialize calculators and re-process data when settings change', async () => {
      const initialSettings = { ...DEFAULT_INDICATOR_SETTINGS, sma: 10, rsi: 7 };
      const newSettings = { ...DEFAULT_INDICATOR_SETTINGS, sma: 20, rsi: 14 };
      
      const mockKlines: BinanceKline[] = [createMockKline(Date.now()/1000, 102)];
      (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockKlines });

      const { result, rerender } = renderHook(
        ({ settings }) => useCandlestickData(mockSymbol, mockInterval, settings),
        { initialProps: { settings: initialSettings } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(SMACalculator).toHaveBeenCalledWith(initialSettings.sma);
      expect(RsiCalculator).toHaveBeenCalledWith(initialSettings.rsi);
      
      // Clear mocks for constructor calls before rerender to isolate the check
      (SMACalculator as jest.Mock).mockClear();
      (RsiCalculator as jest.Mock).mockClear();
      // Also clear seed mocks as they will be called again
      mockSmaSeed.mockClear();
      mockRsiSeed.mockClear();
      (fetch as jest.Mock).mockClear().mockResolvedValue({ ok: true, json: async () => mockKlines });


      act(() => {
        rerender({ settings: newSettings });
      });
      
      expect(result.current.loading).toBe(true); // Should go into loading state again
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(fetch).toHaveBeenCalledTimes(1); // Fetch should be called again due to settings change
      expect(SMACalculator).toHaveBeenCalledWith(newSettings.sma);
      expect(RsiCalculator).toHaveBeenCalledWith(newSettings.rsi);
      
      const expectedPrices = mockKlines.map(k => parseFloat(k[4]));
      expect(mockSmaSeed).toHaveBeenCalledWith(expectedPrices);
      expect(mockRsiSeed).toHaveBeenCalledWith(expectedPrices);
    });
  });

  describe('localStorage Error Handling', () => {
    it('should continue and log warning if localStorage.setItem fails', async () => {
      const mockKlines: BinanceKline[] = [createMockKline(Date.now()/1000, 102)];
      (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockKlines });
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('LocalStorage quota exceeded');
      });

      const { result } = renderHook(() => useCandlestickData(mockSymbol, mockInterval, initialMockSettings));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBeNull(); // Hook itself should not error out
      expect(result.current.candles.length).toBe(mockKlines.length); // Data should still be processed
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save candles to localStorage'), expect.any(Error));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save volumes to localStorage'), expect.any(Error));
      
      consoleWarnSpy.mockRestore();
    });
  });
});
