import type { LineData, UTCTimestamp } from "lightweight-charts";
import {
  computeBollinger,
  computeMACD,
  computeRSI,
  computeSMA,
  RsiCalculator,
} from "./indicators";

export interface IndicatorSeries {
  ma?: LineData;
  rsi?: LineData;
  macd?: LineData;
  signal?: LineData;
  histogram?: LineData;
  bollUpper?: LineData;
  bollLower?: LineData;
}

/**
 * 価格履歴からインジケーターを計算する
 * @param prices - 終値の配列
 * @param time - データ時刻
 * @param rsiCalc - RSI計算機インスタンス（オプション）
 * @returns 計算結果
 */
export function calculateIndicators(
  prices: number[],
  time: UTCTimestamp,
  rsiCalc?: RsiCalculator,
): IndicatorSeries {
  const result: IndicatorSeries = {};
  const ma = computeSMA(prices, 14);
  if (ma !== null) result.ma = { time, value: ma };
  const rsi = rsiCalc
    ? rsiCalc.update(prices[prices.length - 1])
    : computeRSI(prices, 14);
  if (rsi !== null) result.rsi = { time, value: rsi };
  const macd = computeMACD(prices);
  if (macd) {
    result.macd = { time, value: macd.macd };
    result.signal = { time, value: macd.signal };
    result.histogram = { time, value: macd.histogram };
  }
  const boll = computeBollinger(prices);
  if (boll) {
    result.bollUpper = { time, value: boll.upper };
    result.bollLower = { time, value: boll.lower };
  }
  return result;
}

/**
 * 時系列データを更新・追加するユーティリティ
 * @param arr - 既存配列
 * @param item - 追加するデータ
 * @param limit - 最大保持数
 * @returns 更新後の配列
 */
const seriesCache = new WeakMap<unknown[], Map<UTCTimestamp, unknown>>();

export function upsertSeries<T extends { time: UTCTimestamp }>(
  arr: T[],
  item: T,
  limit: number,
): T[] {
  let map = seriesCache.get(arr) as Map<UTCTimestamp, T> | undefined;
  if (!map) {
    map = new Map<UTCTimestamp, T>();
    for (const d of arr) {
      map.set(d.time, d);
    }
  }

  const isNew = !map.has(item.time);
  map.set(item.time, item);

  if (isNew && map.size > limit) {
    const firstKey = map.keys().next().value as UTCTimestamp | undefined;
    if (firstKey !== undefined) {
      map.delete(firstKey);
    }
  }

  const result = Array.from(map.values());
  seriesCache.delete(arr);
  seriesCache.set(result, map as Map<UTCTimestamp, unknown>);
  return result;
}
