import type { UTCTimestamp } from "lightweight-charts";
import type { IndicatorSettings } from "@/constants/chart";
import { DEFAULT_INDICATOR_SETTINGS } from "@/constants/chart";
import {
  computeBollinger,
  computeMACD,
  computeRSI,
  computeSMA,
} from "./indicators";

/**
 * 時系列データ配列に新しいデータを追加または既存のデータを更新します。
 * 配列が指定された上限を超えた場合、最も古いデータを削除します。
 * 
 * @param arr 元の時系列データ配列
 * @param item 追加または更新するデータ
 * @param limit 配列の最大長
 * @returns 更新された配列（新しいインスタンス）
 */
export function upsertSeries<T extends { time: UTCTimestamp }>(
  arr: T[],
  item: T,
  limit: number,
): T[] {
  // Create a new Map from the input array on each call.
  // This allows efficient updates by timestamp.
  const map = new Map<UTCTimestamp, T>();
  for (const d of arr) {
    map.set(d.time, d);
  }

  // Check if the item's timestamp already exists to determine if it's an update or new.
  // This is important for the limit logic: only trim if a truly new item pushes size over limit.
  const isExistingItem = map.has(item.time);
  map.set(item.time, item); // Add or update the item

  // If it was a new item (not an update) and the map size exceeds the limit,
  // remove the oldest item. Maps iterate in insertion order, so the first key is the oldest.
  if (!isExistingItem && map.size > limit) {
    // map.keys().next().value retrieves the first key (oldest timestamp)
    const oldestKey = map.keys().next().value;
    if (oldestKey !== undefined) {
      map.delete(oldestKey);
    }
  }

  // Return a new array of values from the map, sorted by timestamp
  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

export function calculateIndicators(
  closes:number[],
  settings:IndicatorSettings = DEFAULT_INDICATOR_SETTINGS
) {
  return {
    sma: computeSMA(closes, settings.sma),
    rsi: computeRSI(closes, settings.rsi),
    macd: computeMACD(
      closes,
      settings.macd.short,
      settings.macd.long,
      settings.macd.signal
    ),
    bollinger: computeBollinger(closes, settings.boll.period),
  };
}
