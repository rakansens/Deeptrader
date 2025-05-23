// src/lib/chart/core-utils.ts
// チャート関連コアユーティリティ - Phase 2統合 (chart-utils + candlestick-utils)

import type { LineData, UTCTimestamp } from 'lightweight-charts'
import type { IndicatorSettings } from '@/constants/chart'
import { DEFAULT_INDICATOR_SETTINGS } from '@/constants/chart'
import {
  computeBollinger,
  computeMACD,
  computeRSI,
  computeSMA,
} from '@/lib/indicators'

// =============================================================================
// 🔄 時系列データ処理 (旧: chart-utils.ts)
// =============================================================================

/** ValueOf互換のオブジェクトを表すインターフェース */
export interface ValueOfLike {
  valueOf(): number
}

/**
 * さまざまな時間形式を秒数に変換するユーティリティ
 * @param time - 任意の時間表現
 * @returns 秒数表現
 */
export function toNumericTime(time: unknown): number {
  if (typeof time === 'number') return time
  if (typeof time === 'object' && time !== null && 'year' in time && 'month' in time && 'day' in time) {
    const bd = time as { year: number; month: number; day: number }
    return Math.floor(new Date(bd.year, bd.month - 1, bd.day).getTime() / 1000)
  }
  if (time instanceof Date) {
    return Math.floor(time.getTime() / 1000)
  }
  if (typeof time === 'object' && time !== null && 'valueOf' in time) {
    const val = (time as ValueOfLike).valueOf()
    return Math.floor(val / 1000)
  }
  return Math.floor(new Date(time as string).getTime() / 1000)
}

/**
 * タイムスタンプをキーとした系列データの重複除去・ソート
 * @param data - シリーズデータ
 * @param timeToNumber - 時間変換関数
 * @returns 処理済みデータ
 */
export function processTimeSeriesData<T extends { time: unknown }>(
  data: T[],
  timeToNumber: (time: unknown) => number
): T[] {
  if (!data || data.length === 0) return []

  const timeMap = new Map<number, T>()
  data.forEach(item => {
    const timeKey = timeToNumber(item.time)
    if (!timeMap.has(timeKey)) {
      timeMap.set(timeKey, item)
    }
  })

  const uniqueData = Array.from(timeMap.values())
  const sortedData = uniqueData.sort((a, b) => {
    const timeA = timeToNumber(a.time)
    const timeB = timeToNumber(b.time)
    return timeA - timeB
  })

  const finalData: T[] = []
  let prevTime: number | null = null
  for (const item of sortedData) {
    const currentTime = timeToNumber(item.time)
    if (prevTime !== currentTime) {
      finalData.push(item)
      prevTime = currentTime
    }
  }

  return finalData
}

/**
 * ラインチャートデータをソート・重複除去する
 * @param arr - LineData 配列
 * @returns 前処理されたデータ
 */
export function preprocessLineData(arr: LineData[]): LineData[] {
  return processTimeSeriesData(arr, toNumericTime)
}

// =============================================================================
// 📊 ローソク足データ処理 (旧: candlestick-utils.ts)
// =============================================================================

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

/**
 * 指標計算のヘルパー関数
 * @param closes 終値配列
 * @param settings 指標設定
 * @returns 計算された指標群
 */
export function calculateIndicators(
  closes: number[],
  settings: IndicatorSettings = DEFAULT_INDICATOR_SETTINGS
) {
  return {
    sma: computeSMA(closes, settings.ma.ma1),
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