/**
 * チャート関連ユーティリティ
 */

/**
 * タイムスタンプでソートし重複を取り除く
 * @param data - 時系列データ配列
 * @param timeToNumber - timeフィールドを数値に変換する関数
 * @returns 処理済みのデータ
 */
export function processTimeSeriesData<T extends { time: unknown }>(
  data: T[],
  timeToNumber: (time: unknown) => number,
): T[] {
  if (!data || data.length === 0) return [];

  try {
    const withTimestamps = data.map((item) => ({
      timestamp: timeToNumber(item.time),
      data: item,
    }));

    const sorted = [...withTimestamps].sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        return withTimestamps.indexOf(a) - withTimestamps.indexOf(b);
      }
      return a.timestamp - b.timestamp;
    });

    const uniqueEntries: Array<T> = [];
    const seenTimestamps = new Set<number>();
    for (const { timestamp, data } of sorted) {
      if (!seenTimestamps.has(timestamp)) {
        seenTimestamps.add(timestamp);
        uniqueEntries.push(data);
      }
    }

    for (let i = 1; i < uniqueEntries.length; i++) {
      const prevTime = timeToNumber(uniqueEntries[i - 1].time);
      const currTime = timeToNumber(uniqueEntries[i].time);
      if (prevTime > currTime) {
        console.warn(`Data not in ascending order at index ${i}, fixing...`);
        return [...uniqueEntries].sort(
          (a, b) => timeToNumber(a.time) - timeToNumber(b.time),
        );
      }
    }

    return uniqueEntries;
  } catch (error) {
    console.error("Error processing time series data:", error);
    return [];
  }
}
