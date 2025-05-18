import type { LineData } from 'lightweight-charts'

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
    const val = (time as { valueOf: () => number }).valueOf()
    return Math.floor(val / 1000)
  }
  return Math.floor(new Date(time as string).getTime() / 1000)
}

/**
 * ラインチャートデータをソート・重複除去する
 * @param arr - LineData 配列
 * @returns 前処理されたデータ
 */
export function preprocessLineData(arr: LineData[]): LineData[] {
  return processTimeSeriesData(arr, toNumericTime)
}

/**
 * タイムスタンプをキーとした系列データの重複除去
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
