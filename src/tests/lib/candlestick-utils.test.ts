import { calculateIndicators, upsertSeries } from "@/lib/candlestick-utils";
import { RsiCalculator } from "@/lib/indicators";
import type { LineData, UTCTimestamp } from "lightweight-charts";

describe("candlestick-utils", () => {
  describe("calculateIndicators", () => {
    it("returns indicator values when enough data with RsiCalculator", () => {
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

    it("returns indicator values when enough data with settings", () => {
      const prices = Array.from({ length: 50 }, (_, i) => i + 1);
      const res = calculateIndicators(prices, 1 as UTCTimestamp, {
        sma: 10,
        rsi: 10,
        macd: { short: 5, long: 8, signal: 3 },
        boll: 10,
        lineWidth: { ma: 2, rsi: 2, macd: 2, boll: 1 },
        colors: { ma: '#FF0000', rsi: '#00FF00', macd: '#0000FF', boll: '#FFFF00' }
      });
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

    it("correctly handles multiple calls with the same array instance (verifying caching)", () => {
      const sharedArrayInstance: LineData<UTCTimestamp>[] = [
        { time: 1 as UTCTimestamp, value: 100 },
        { time: 2 as UTCTimestamp, value: 200 },
      ];
      const limit = 3;

      // Call 1: Add item3
      const result1 = upsertSeries(
        sharedArrayInstance,
        { time: 3 as UTCTimestamp, value: 300 },
        limit,
      );
      expect(result1).toEqual([
        { time: 1 as UTCTimestamp, value: 100 },
        { time: 2 as UTCTimestamp, value: 200 },
        { time: 3 as UTCTimestamp, value: 300 },
      ]);

      // Call 2: Add item4 (item1 should be trimmed)
      // Pass sharedArrayInstance again
      const result2 = upsertSeries(
        sharedArrayInstance,
        { time: 4 as UTCTimestamp, value: 400 },
        limit,
      );
      // Because the map is mutated in place, and keys are ordered by insertion,
      // when item1 is deleted and item4 is added, the order will be item2, item3, item4.
      expect(result2).toEqual([
        { time: 2 as UTCTimestamp, value: 200 },
        { time: 3 as UTCTimestamp, value: 300 },
        { time: 4 as UTCTimestamp, value: 400 },
      ]);

      // Call 3: Update item2's value
      // Pass sharedArrayInstance again
      const result3 = upsertSeries(
        sharedArrayInstance,
        { time: 2 as UTCTimestamp, value: 222 }, // Update existing time: 2
        limit,
      );
      // Map preserves insertion order for keys. Updating a value doesn't change key order.
      // The items in the map (keyed by 'sharedArrayInstance') are {2:200, 3:300, 4:400}.
      // Updating time:2 will result in {2:222, 3:300, 4:400}.
      expect(result3).toEqual([
        { time: 2 as UTCTimestamp, value: 222 },
        { time: 3 as UTCTimestamp, value: 300 },
        { time: 4 as UTCTimestamp, value: 400 },
      ]);
      expect(result3.length).toBe(3); // Ensure limit is still respected
    });
  });
});
