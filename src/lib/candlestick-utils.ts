import type { UTCTimestamp } from "lightweight-charts";
// Unused imports related to calculateIndicators have been removed:
// import type { LineData } from "lightweight-charts";
// import type { IndicatorSettings } from "@/types/chart";
// import { DEFAULT_INDICATOR_SETTINGS } from "@/types/chart";
// import {
//   computeBollinger,
//   computeMACD,
//   computeRSI,
//   computeSMA,
//   RsiCalculator, // This was the old RsiCalculator
// } from "./indicators";

// The IndicatorSeries interface is no longer needed as calculateIndicators is removed.

// The calculateIndicators function has been removed as its logic is now
// handled directly within use-candlestick-data.ts using the new calculator classes.

/**
 * 時系列データを更新・追加するユーティリティ
 * @param arr - 既存配列
 * @param item - 追加するデータ
 * @param limit - 最大保持数
 * @returns 更新後の配列
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

  // Convert the map values back to an array.
  // The order will be based on insertion order, which should be chronological
  // if the input array `arr` was sorted and new items are later or updates.
  return Array.from(map.values());
}
