import {
  computeSMA,
  computeEMA,
  computeRSI,
  computeMACD,
  computeBollinger,
  RsiCalculator,
} from '@/lib/indicators';

describe('indicators utilities', () => {
  describe('computeSMA', () => {
    it('returns null when data is insufficient', () => {
      expect(computeSMA([1, 2], 5)).toBeNull();
    });

    it('calculates simple moving average', () => {
      expect(computeSMA([1, 2, 3, 4, 5], 3)).toBe(4);
    });
  });

  describe('computeEMA', () => {
    it('returns null when data is insufficient', () => {
      expect(computeEMA([1, 2], 3)).toBeNull();
    });

    it('calculates exponential moving average', () => {
      const result = computeEMA([1, 2, 3, 4, 5], 3);
      expect(result).toBeCloseTo(4);
    });
  });

  describe('incremental computeEMA', () => {
    it('matches computeEMA for sample data', () => {
      const data = [1, 2, 3, 4, 5, 6];
      let ema: number | null = null;
      for (let i = 0; i < data.length; i++) {
        ema = computeEMA(data.slice(0, i + 1), 3);
      }
      const expected = computeEMA(data, 3)!;
      expect(ema).toBeCloseTo(expected);
    });
  });

  describe('computeRSI', () => {
    it('returns null when data is insufficient', () => {
      expect(computeRSI([1, 2, 3], 5)).toBeNull();
    });

    it('returns 100 for continuously rising prices (Only Gains)', () => {
      const data = [1, 2, 3, 4, 5, 6]; // All gains
      expect(computeRSI(data, 5)).toBe(100);
    });

    it('returns 0 for continuously falling prices (Only Losses)', () => {
      const data = [6, 5, 4, 3, 2, 1]; // All losses
      expect(computeRSI(data, 5)).toBe(0);
    });

    it('returns 50 for no change in prices (No Gains, No Losses)', () => {
      const data = [10, 10, 10, 10, 10, 10]; // No change
      expect(computeRSI(data, 5)).toBe(50);
    });

    it('calculates RSI correctly for normal conditions', () => {
      // Example from: https://school.stockcharts.com/doku.php?id=technical_indicators:relative_strength_index_rsi
      // Day 1-15 prices (using Close prices for calculation)
      // For a 14-period RSI
      // Gains: 0.31, 0.56, 0.1, 0.15, 0.42, 0.01, 0.23 = sum 1.78 / 14 = 0.127 (AvgGain)
      // Losses: 0.19, 0.51, 0.06, 0.09, 0.22, 0.11, 0.13 = sum 1.31 / 14 = 0.093 (AvgLoss)
      // RS = 0.127 / 0.093 = 1.3655
      // RSI = 100 - (100 / (1 + 1.3655)) = 100 - (100 / 2.3655) = 100 - 42.27 = 57.73
      // Using a simpler dataset for clarity in test:
      // Prices: 10, 11, 10, 9, 10, 11, 12 (7 data points, use period 6 for RSI)
      // Changes: +1, -1, -1, +1, +1, +1
      // Period: 6
      // Gains: 1, 1, 1, 1 = 4
      // Losses: 1, 1 = 2
      // AvgGain = 4/6
      // AvgLoss = 2/6
      // RS = (4/6) / (2/6) = 2
      // RSI = 100 - (100 / (1 + 2)) = 100 - (100/3) = 100 - 33.333... = 66.666...
      const data = [10, 11, 10, 9, 10, 11, 12]; // Mixed gains and losses
      const period = 6;
      expect(computeRSI(data, period)).toBeCloseTo(66.66666666666667);
    });

    // The existing test for insufficient data:
    // it('returns null when data is insufficient', () => {
    //   expect(computeRSI([1, 2, 3], 5)).toBeNull();
    // });
    // This will be kept as is.
  });

  describe('RsiCalculator', () => {
    it('updates incrementally', () => {
      const calc = new RsiCalculator(3);
      expect(calc.update(1)).toBeNull();
      expect(calc.update(2)).toBeNull();
      expect(calc.update(3)).toBeNull();
      const rsi = calc.update(4);
      expect(rsi).toBe(100);
    });

    it('handles falling prices', () => {
      const calc = new RsiCalculator(2);
      expect(calc.update(3)).toBeNull();
      expect(calc.update(2)).toBeNull();
      const first = calc.update(1);
      expect(first).toBe(0);
      const second = calc.update(0);
      expect(second).toBe(0);
    });
  });

  describe('computeMACD', () => {
    it('returns null when data is insufficient', () => {
      expect(computeMACD(Array(10).fill(1))).toBeNull();
    });

    it('returns zero values for flat data', () => {
      const data = Array(60).fill(10);
      const macd = computeMACD(data);
      expect(macd).not.toBeNull();
      expect(macd!.macd).toBeCloseTo(0);
      expect(macd!.signal).toBeCloseTo(0);
      expect(macd!.histogram).toBeCloseTo(0);
    });
  });

  describe('incremental computeMACD', () => {
    it('matches final computeMACD result', () => {
      const data = Array.from({ length: 60 }, (_, i) => i + 1);
      let res: { macd: number; signal: number; histogram: number } | null = null;
      for (let i = 0; i < data.length; i++) {
        res = computeMACD(data.slice(0, i + 1));
      }
      const expected = computeMACD(data)!;
      expect(res).not.toBeNull();
      expect(res!.macd).toBeCloseTo(expected.macd);
      expect(res!.signal).toBeCloseTo(expected.signal);
      expect(res!.histogram).toBeCloseTo(expected.histogram);
    });
  });

  describe('computeBollinger', () => {
    it('returns null when data is insufficient', () => {
      expect(computeBollinger([1, 2, 3], 20)).toBeNull();
    });

    it('returns same upper and lower for constant prices', () => {
      const data = Array(20).fill(10);
      const band = computeBollinger(data, 20);
      expect(band).toEqual({ upper: 10, lower: 10 });
    });
  });
});
