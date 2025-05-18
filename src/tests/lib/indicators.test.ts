import { computeSMA, computeEMA, computeRSI, computeMACD, computeBollinger } from '@/lib/indicators';

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

  describe('computeRSI', () => {
    it('returns null when data is insufficient', () => {
      expect(computeRSI([1, 2, 3], 5)).toBeNull();
    });

    it('returns 100 for continuously rising prices', () => {
      const data = [1, 2, 3, 4, 5, 6];
      expect(computeRSI(data, 5)).toBe(100);
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
