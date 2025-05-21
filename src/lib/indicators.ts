/**
 * テクニカル指標計算ユーティリティ
 * (旧式のバッチ計算関数は削除されました。代わりに各Calculatorクラスを使用してください。)
 */

// computeSMA, computeEMA, computeRSI, computeMACD, computeBollinger functions have been removed.

import { UTCTimestamp } from "lightweight-charts";

/**
 * SMA (Simple Moving Average)を逐次計算するクラス
 */
export class SMACalculator {
  private values: number[] = [];
  private sum = 0;
  private avg: number | null = null;

  constructor(private readonly period: number) {
    if (period <= 0) {
      throw new Error("Period must be a positive integer.");
    }
  }

  seed(values: number[]): void {
    this.values = [];
    this.sum = 0;
    this.avg = null;

    values.forEach(value => this.update(value));
  }

  update(value: number): number | null {
    this.values.push(value);
    this.sum += value;

    if (this.values.length > this.period) {
      const removed = this.values.shift()!;
      this.sum -= removed;
    }

    if (this.values.length === this.period) {
      this.avg = this.sum / this.period;
      return this.avg;
    }

    return null;
  }

  getAverage(): number | null {
    return this.avg;
  }
}

/**
 * Bollinger Bands を逐次計算するクラス
 */
export class BollingerBandsCalculator {
  private prices: number[] = [];
  private smaCalc: SMACalculator;
  private middleBand: number | null = null;
  private upperBand: number | null = null;
  private lowerBand: number | null = null;

  constructor(private readonly period: number, private readonly numStdDev: number = 2) {
    if (period <= 0) {
      throw new Error("Period must be a positive integer.");
    }
    if (numStdDev <= 0) {
      throw new Error("Number of standard deviations must be positive.");
    }
    this.smaCalc = new SMACalculator(period);
  }

  seed(prices: number[]): void {
    this.prices = []; // Reset local prices
    this.smaCalc.seed(prices); // Seed the internal SMA calculator

    // To calculate initial bands, we need to process historical prices
    // and get the SMA for each point to calculate std dev correctly.
    // The SMACalculator's seed method already processes all prices.
    // We just need to iterate through the input prices again to get the final state.
    prices.forEach(price => this.update(price));
  }

  update(price: number): { upper: number; middle: number; lower: number } | null {
    this.prices.push(price);
    
    // Keep a window of the last `period` prices
    if (this.prices.length > this.period) {
      this.prices.shift();
    }

    // Update SMA (middle band)
    const sma = this.smaCalc.update(price);
    if (sma === null || this.prices.length < this.period) {
      return null; // Not enough data yet
    }

    // Calculate standard deviation
    const squaredDiffs = this.prices.map(p => Math.pow(p - sma, 2));
    const variance = squaredDiffs.reduce((sum, sqDiff) => sum + sqDiff, 0) / this.period;
    const stdDev = Math.sqrt(variance);

    // Calculate bands
    this.middleBand = sma;
    this.upperBand = sma + (this.numStdDev * stdDev);
    this.lowerBand = sma - (this.numStdDev * stdDev);

    return {
      middle: this.middleBand,
      upper: this.upperBand,
      lower: this.lowerBand
    };
  }

  getBands(): { upper: number; middle: number; lower: number } | null {
    if (this.middleBand === null || this.upperBand === null || this.lowerBand === null) {
      return null;
    }

    return {
      middle: this.middleBand,
      upper: this.upperBand,
      lower: this.lowerBand
    };
  }
}

/**
 * EMA (Exponential Moving Average)を逐次計算するクラス
 */
export class EMACalculator {
  private value: number | null = null;
  private multiplier: number;

  constructor(private readonly period: number) {
    if (period <= 0) {
      throw new Error("Period must be a positive integer.");
    }
    // EMA multiplier = 2 / (period + 1)
    this.multiplier = 2 / (period + 1);
  }

  seed(values: number[]): void {
    this.value = null;
    
    if (values.length === 0) return;

    // For seed data, we calculate SMA for the first period points
    // then use that as the starting EMA
    if (values.length >= this.period) {
      // Calculate SMA for the first `period` values
      const sum = values.slice(0, this.period).reduce((acc, val) => acc + val, 0);
      this.value = sum / this.period;
      
      // Process the rest of the values using EMA formula
      for (let i = this.period; i < values.length; i++) {
        this.update(values[i]);
      }
    } else {
      // If we don't have enough values for a full period,
      // use the available values to compute a simple average
      const sum = values.reduce((acc, val) => acc + val, 0);
      this.value = sum / values.length;
    }
  }

  update(value: number): number {
    if (this.value === null) {
      // First value is used as-is if no seed data was provided
      this.value = value;
    } else {
      // EMA = Previous EMA + multiplier * (Current Price - Previous EMA)
      this.value = (value - this.value) * this.multiplier + this.value;
    }
    return this.value;
  }

  getValue(): number | null {
    return this.value;
  }
}

/**
 * RSI (Relative Strength Index)を逐次計算するクラス
 */
export class RsiCalculator {
  private values: number[] = [];
  private gains: number[] = [];
  private losses: number[] = [];
  private avgGain: number | null = null;
  private avgLoss: number | null = null;
  private rsi: number | null = null;
  
  constructor(private readonly period: number) {
    if (period <= 0) {
      throw new Error("Period must be a positive integer.");
    }
  }

  seed(values: number[]): void {
    this.values = [];
    this.gains = [];
    this.losses = [];
    this.avgGain = null;
    this.avgLoss = null;
    this.rsi = null;

    values.forEach(value => this.update(value));
  }

  update(value: number): number | null {
    this.values.push(value);
    
    // We need at least two values to calculate a change
    if (this.values.length < 2) {
      return null;
    }

    // Calculate change from previous value
    const change = value - this.values[this.values.length - 2];
    
    // Record gain or loss
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    this.gains.push(gain);
    this.losses.push(loss);
    
    // Keep only the required amount of history
    if (this.values.length > this.period + 1) {
      this.values.shift();
      this.gains.shift();
      this.losses.shift();
    }
    
    // Not enough data to calculate RSI yet
    if (this.gains.length < this.period) {
      return null;
    }
    
    // Calculate average gain and loss
    if (this.avgGain === null || this.avgLoss === null) {
      // First average is a simple average
      this.avgGain = this.gains.slice(0, this.period).reduce((sum, g) => sum + g, 0) / this.period;
      this.avgLoss = this.losses.slice(0, this.period).reduce((sum, l) => sum + l, 0) / this.period;
    } else {
      // Subsequent averages use smoother formula:
      // avgGain = ((prevAvgGain * (period-1)) + currentGain) / period
      this.avgGain = ((this.avgGain * (this.period - 1)) + gain) / this.period;
      this.avgLoss = ((this.avgLoss * (this.period - 1)) + loss) / this.period;
    }
    
    // Prevent division by zero
    if (this.avgLoss === 0) {
      this.rsi = 100;
    } else {
      // Calculate RS (Relative Strength)
      const rs = this.avgGain / this.avgLoss;
      // Calculate RSI (Relative Strength Index)
      this.rsi = 100 - (100 / (1 + rs));
    }
    
    return this.rsi;
  }

  getValue(): number | null {
    return this.rsi;
  }
}

/**
 * MACD (Moving Average Convergence/Divergence)を逐次計算するクラス
 * これは当日の値を必要とせず、前日までの値を使って計算します
 */
export class MACDCalculator {
  private fastEMA: EMACalculator;
  private slowEMA: EMACalculator;
  private signalEMA: EMACalculator;
  
  private macdLine: number | null = null;
  private signalLine: number | null = null;
  private histogram: number | null = null;
  
  constructor(
    private readonly fastPeriod: number = 12,
    private readonly slowPeriod: number = 26,
    private readonly signalPeriod: number = 9
  ) {
    if (fastPeriod >= slowPeriod) {
      throw new Error("Fast period must be less than slow period.");
    }
    this.fastEMA = new EMACalculator(fastPeriod);
    this.slowEMA = new EMACalculator(slowPeriod);
    this.signalEMA = new EMACalculator(signalPeriod);
  }

  seed(values: number[]): void {
    this.fastEMA.seed(values);
    this.slowEMA.seed(values);
    
    // Generate MACD line values for signal line seeding
    const macdValues: number[] = [];
    let fastValue = this.fastEMA.getValue();
    let slowValue = this.slowEMA.getValue();
    
    // If we don't have both EMAs yet, we can't calculate MACD
    if (fastValue === null || slowValue === null) {
      return;
    }
    
    // Start with the current MACD value
    this.macdLine = fastValue - slowValue;
    macdValues.push(this.macdLine);
    
    // Reset and re-seed the signal EMA with our generated MACD values
    this.signalEMA.seed(macdValues);
    
    // Calculate current signal line and histogram
    this.updateSignalAndHistogram();
  }

  update(value: number): { macd: number; signal: number; histogram: number } | null {
    // Update both EMAs with the new price
    const fastValue = this.fastEMA.update(value);
    const slowValue = this.slowEMA.update(value);
    
    // If we don't have both EMAs yet, we can't calculate MACD
    if (fastValue === null || slowValue === null) {
      return null;
    }
    
    // Calculate MACD line (fast EMA - slow EMA)
    this.macdLine = fastValue - slowValue;
    
    // Update signal line (EMA of MACD line)
    if (this.signalLine === null) {
      // First MACD value becomes the first signal value
      this.signalLine = this.macdLine;
    } else {
      // Update signal EMA with new MACD value
      this.signalLine = this.signalEMA.update(this.macdLine);
    }
    
    // Update histogram (MACD line - signal line)
    this.updateSignalAndHistogram();
    
    return this.getValues();
  }

  private updateSignalAndHistogram(): void {
    if (this.macdLine !== null && this.signalLine !== null) {
      this.histogram = this.macdLine - this.signalLine;
    }
  }

  getValues(): { macd: number; signal: number; histogram: number } | null {
    if (this.macdLine === null || this.signalLine === null || this.histogram === null) {
      return null;
    }
    
    return {
      macd: this.macdLine,
      signal: this.signalLine,
      histogram: this.histogram
    };
  }
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

