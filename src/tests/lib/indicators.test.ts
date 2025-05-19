import {
  computeSMA,
  computeEMA,
  computeRSI,
  computeMACD,
  computeBollinger,
  RsiCalculator,
  EmaCalculator,
  MacdCalculator,
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

  describe('EmaCalculator', () => {
    it('matches computeEMA for sample data', () => {
      const data = [1, 2, 3, 4, 5, 6];
      const calc = new EmaCalculator(3);
      let ema: number | null = null;
      for (const p of data) {
        const r = calc.update(p);
        if (r !== null) ema = r;
      }
      const expected = computeEMA(data, 3)!;
      expect(ema).toBeCloseTo(expected);
    });
  });

  describe('computeRSI', () => {
    it('returns null when data is insufficient', () => {
      expect(computeRSI([1, 2, 3], 5)).toBeNull();
    });

    it('returns 100 for continuously rising prices', () => {
      const data = [1, 2, 3, 4, 5, 6];
      expect(computeRSI(data, 5)).toBe(100);
    });
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

  describe('MacdCalculator', () => {
    it('matches computeMACD for sample data', () => {
      const data = Array.from({ length: 60 }, (_, i) => i + 1);
      const calc = new MacdCalculator();
      let res: { macd: number; signal: number; histogram: number } | null = null;
      for (const p of data) {
        const r = calc.update(p);
        if (r) res = r;
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
