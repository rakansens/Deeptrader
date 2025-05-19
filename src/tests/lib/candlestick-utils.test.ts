import { calculateIndicators, upsertSeries } from "@/lib/candlestick-utils";
import { RsiCalculator } from "@/lib/indicators";
import type { LineData, UTCTimestamp } from "lightweight-charts";

describe("candlestick-utils", () => {
  describe("calculateIndicators", () => {
    it("returns indicator values when enough data", () => {
      const prices = Array.from({ length: 50 }, (_, i) => i + 1);
      const rsiCalc = new RsiCalculator(14);
      prices.forEach((p) => rsiCalc.update(p));
      const res = calculateIndicators(prices, 1 as UTCTimestamp, rsiCalc);
      expect(res.ma).toBeDefined();
      expect(res.rsi).toBeDefined();
      expect(res.macd).toBeDefined();
      expect(res.signal).toBeDefined();
      expect(res.histogram).toBeDefined();
      expect(res.bollUpper).toBeDefined();
      expect(res.bollLower).toBeDefined();
    });
  });

  describe("upsertSeries", () => {
    it("updates existing entry", () => {
      const arr: LineData<UTCTimestamp>[] = [{ time: 1 as UTCTimestamp, value: 1 }];
      const result = upsertSeries(
        arr,
        { time: 1 as UTCTimestamp, value: 2 },
        3,
      );
      expect(result).toEqual([{ time: 1, value: 2 }]);
    });

    it("adds new entry and trims", () => {
      const arr: LineData<UTCTimestamp>[] = [
        { time: 1 as UTCTimestamp, value: 1 },
        { time: 2 as UTCTimestamp, value: 2 },
        { time: 3 as UTCTimestamp, value: 3 },
      ];
      const result = upsertSeries(
        arr,
        { time: 4 as UTCTimestamp, value: 4 },
        3,
      );
      expect(result.length).toBe(3);
      expect(result[2].value).toBe(4);
    });
  });
});
