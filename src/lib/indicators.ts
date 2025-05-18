/**
 * テクニカル指標計算ユーティリティ
 * すべての関数は十分なデータが存在しない場合は null を返す
 */

/**
 * 単純移動平均を計算する
 * @param data - 価格データの配列
 * @param period - 計算期間
 * @returns 平均値または null
 */
export function computeSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * 指数移動平均を計算する
 * @param data - 価格データの配列
 * @param period - 計算期間
 * @returns EMA または null
 */
export function computeEMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

/**
 * RSI を計算する
 * @param data - 価格データの配列
 * @param period - 計算期間
 * @returns RSI 値または null
 */
export function computeRSI(data: number[], period: number): number | null {
  if (data.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * MACD を計算する
 * @param data - 価格データの配列
 * @param shortPeriod - 短期 EMA の期間 (デフォルト: 12)
 * @param longPeriod - 長期 EMA の期間 (デフォルト: 26)
 * @param signalPeriod - シグナル線の期間 (デフォルト: 9)
 * @returns MACD, シグナル, ヒストグラムまたは null
 */
export function computeMACD(
  data: number[],
  shortPeriod = 12,
  longPeriod = 26,
  signalPeriod = 9
): { macd: number; signal: number; histogram: number } | null {
  if (data.length < longPeriod + signalPeriod) return null;
  const macdSeries: number[] = [];
  for (let i = longPeriod; i <= data.length; i++) {
    const slice = data.slice(0, i);
    const shortEma = computeEMA(slice, shortPeriod);
    const longEma = computeEMA(slice, longPeriod);
    if (shortEma === null || longEma === null) continue;
    macdSeries.push(shortEma - longEma);
  }
  const macd = macdSeries[macdSeries.length - 1];
  const signal = computeEMA(macdSeries, signalPeriod);
  if (signal === null) return null;
  return { macd, signal, histogram: macd - signal };
}

/**
 * ボリンジャーバンドを計算する
 * @param data - 価格データの配列
 * @param period - 計算期間 (デフォルト: 20)
 * @returns 上下バンド値または null
 */
export function computeBollinger(
  data: number[],
  period = 20
): { upper: number; lower: number } | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  return { upper: mean + 2 * sd, lower: mean - 2 * sd };
}

/**
 * 主要インジケーターをまとめて計算する
 * @param prices - 終値データの配列
 * @returns 各インジケーターの計算結果
 */
export function calculateIndicators(prices: number[]) {
  const ma = computeSMA(prices, 14);
  const rsi = computeRSI(prices, 14);
  const macd = computeMACD(prices);
  const boll = computeBollinger(prices);
  return {
    ma,
    rsi,
    macd,
    boll,
  };
}

