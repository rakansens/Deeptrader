import type { LineData } from 'lightweight-charts'

/**
 * ラインチャートデータをソート・重複除去する
 * @param arr - LineData 配列
 * @returns 前処理されたデータ
 */
export function preprocessLineData(arr: LineData[]): LineData[] {
  if (!arr || arr.length === 0) return []

  const getNumTime = (t: LineData['time']): number => {
    if (typeof t === 'number') return t
    if (typeof t === 'object' && t !== null && 'year' in t && 'month' in t && 'day' in t) {
      const bd = t as { year: number; month: number; day: number }
      return Math.floor(new Date(bd.year, bd.month - 1, bd.day).getTime() / 1000)
    }
    if (typeof t === 'object' && t !== null && 'valueOf' in t) {
      return (t as any).valueOf()
    }
    return Math.floor(new Date(t as unknown as string).getTime() / 1000)
  }

  const timeMap = new Map<number, LineData>()
  arr.forEach(item => {
    const timeKey = getNumTime(item.time)
    if (!timeMap.has(timeKey)) {
      timeMap.set(timeKey, item)
    }
  })

  const uniqueData = Array.from(timeMap.values())
  const sortedData = uniqueData.sort((a, b) => {
    const timeA = getNumTime(a.time)
    const timeB = getNumTime(b.time)
    return timeA - timeB
  })

  const finalData: LineData[] = []
  let prevTime: number | null = null
  for (const item of sortedData) {
    const currentTime = getNumTime(item.time)
    if (prevTime !== currentTime) {
      finalData.push(item)
      prevTime = currentTime
    }
  }

  return finalData
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
