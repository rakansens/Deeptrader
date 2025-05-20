/**
 * テクニカル指標計算ユーティリティ
 * (旧式のバッチ計算関数は削除されました。代わりに各Calculatorクラスを使用してください。)
 */

// computeSMA, computeEMA, computeRSI, computeMACD, computeBollinger functions have been removed.

/**
 * SMA を逐次計算するクラス
 */
export class SMACalculator {
  private prices: number[] = [];
  private sma: number | null = null;

  constructor(private readonly period: number) {
    if (period <= 0) {
      throw new Error("Period must be a positive integer.");
    }
  }

  seed(prices: number[]): void {
    this.prices = []; // Reset prices
    this.sma = null; 
    prices.forEach(price => this.update(price)); // Process historical prices
  }

  update(price: number): number | null {
    this.prices.push(price);
    if (this.prices.length > this.period) {
      this.prices.shift(); // Remove the oldest price
    }

    if (this.prices.length === this.period) {
      const sum = this.prices.reduce((a, b) => a + b, 0);
      this.sma = sum / this.period;
      return this.sma;
    }
    
    this.sma = null; // Not enough data yet
    return null;
  }

  getResult(): number | null {
    return this.sma;
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
    if (this.prices.length > this.period) {
      this.prices.shift(); // Remove the oldest price
    }

    this.middleBand = this.smaCalc.update(price);

    if (this.middleBand === null || this.prices.length < this.period) {
      this.upperBand = null;
      this.lowerBand = null;
      return null;
    }

    const variance = this.prices.reduce((sum, p) => sum + (p - this.middleBand!) ** 2, 0) / this.period;
    const sd = Math.sqrt(variance);

    this.upperBand = this.middleBand + this.numStdDev * sd;
    this.lowerBand = this.middleBand - this.numStdDev * sd;

    return { upper: this.upperBand, middle: this.middleBand, lower: this.lowerBand };
  }

  getResult(): { upper: number; middle: number; lower: number } | null {
    if (this.upperBand !== null && this.middleBand !== null && this.lowerBand !== null) {
      return { upper: this.upperBand, middle: this.middleBand, lower: this.lowerBand };
    }
    return null;
  }
}

/**
 * MACD を逐次計算するクラス
 */
export class MACDCalculator {
  private shortEmaCalc: EMACalculator;
  private longEmaCalc: EMACalculator;
  private signalEmaCalc: EMACalculator;
  private macdLine: number | null = null;
  private signalLine: number | null = null;
  private histogram: number | null = null;

  constructor(
    private readonly shortPeriod: number,
    private readonly longPeriod: number,
    private readonly signalPeriod: number,
  ) {
    if (shortPeriod <= 0 || longPeriod <= 0 || signalPeriod <= 0) {
      throw new Error("Periods must be positive integers.");
    }
    if (shortPeriod >= longPeriod) {
      throw new Error("Short period must be less than long period for MACD.");
    }
    this.shortEmaCalc = new EMACalculator(shortPeriod);
    this.longEmaCalc = new EMACalculator(longPeriod);
    this.signalEmaCalc = new EMACalculator(signalPeriod);
  }

  seed(prices: number[]): void {
    this.shortEmaCalc.seed(prices);
    this.longEmaCalc.seed(prices);

    // Seed the signal line calculator with historical MACD values
    const macdValuesForSignalSeeding: number[] = [];
    // Temporarily store initial prices to re-calculate MACD for seeding signal
    const tempShortEma = new EMACalculator(this.shortPeriod);
    const tempLongEma = new EMACalculator(this.longPeriod);
    
    for (const price of prices) {
        const shortEma = tempShortEma.update(price);
        const longEma = tempLongEma.update(price);

        if (shortEma !== null && longEma !== null) {
            const macdValue = shortEma - longEma;
            macdValuesForSignalSeeding.push(macdValue);
        }
    }
    
    this.signalEmaCalc.seed(macdValuesForSignalSeeding);

    // Set the current MACD state after seeding all internal calculators
    const currentShortEma = this.shortEmaCalc.getResult();
    const currentLongEma = this.longEmaCalc.getResult();

    if (currentShortEma !== null && currentLongEma !== null) {
      this.macdLine = currentShortEma - currentLongEma;
      this.signalLine = this.signalEmaCalc.getResult(); // Get latest signal from seeded values
      if (this.macdLine !== null && this.signalLine !== null) {
        this.histogram = this.macdLine - this.signalLine;
      } else {
        this.histogram = null;
      }
    } else {
      this.macdLine = null;
      this.signalLine = null;
      this.histogram = null;
    }
  }

  update(price: number): { macd: number; signal: number; histogram: number } | null {
    const shortEma = this.shortEmaCalc.update(price);
    const longEma = this.longEmaCalc.update(price);

    if (shortEma === null || longEma === null) {
      this.macdLine = null;
      this.signalLine = null;
      this.histogram = null;
      return null;
    }

    this.macdLine = shortEma - longEma;
    this.signalLine = this.signalEmaCalc.update(this.macdLine);

    if (this.signalLine === null) {
      this.histogram = null;
      return null; // Not enough data for signal line yet
    }

    this.histogram = this.macdLine - this.signalLine;
    return { macd: this.macdLine, signal: this.signalLine, histogram: this.histogram };
  }

  getResult(): { macd: number; signal: number; histogram: number } | null {
    if (this.macdLine !== null && this.signalLine !== null && this.histogram !== null) {
      return { macd: this.macdLine, signal: this.signalLine, histogram: this.histogram };
    }
    return null;
  }
}

/**
 * EMA を逐次計算するクラス
 */
export class EMACalculator {
  private ema: number | null = null;
  private k: number;

  constructor(private readonly period: number) {
    if (period <= 0) {
      throw new Error("Period must be a positive integer.");
    }
    this.k = 2 / (period + 1);
  }

  seed(prices: number[]): void {
    this.ema = null;
    if (prices.length === 0) return;

    // Initial EMA is an SMA of the first 'period' prices
    if (prices.length >= this.period) {
      const initialSlice = prices.slice(0, this.period);
      const sum = initialSlice.reduce((a, b) => a + b, 0);
      this.ema = sum / this.period;

      // Process remaining prices in the seed data using EMA formula
      for (let i = this.period; i < prices.length; i++) {
        this.update(prices[i]);
      }
    }
    // If prices.length < period, EMA remains null until enough data is updated.
  }

  update(price: number): number | null {
    if (this.ema === null) {
      // This case should ideally be handled by seeding with enough data
      // or by having a growing window until period is met, similar to SMA.
      // For simplicity, if not seeded, we'd need 'period' values to form the first SMA.
      // However, the current design expects seeding. If called without seeding
      // or with insufficient seed, it won't produce an EMA until enough updates.
      // This might need adjustment based on how it's used if seeding isn't guaranteed.
      // For now, let's assume it starts calculating once it has an initial EMA.
      // A more robust approach would be to collect prices until 'period' is met,
      // calculate SMA, then switch to EMA.
      // Let's assume for now that if ema is null, it means we are still in the initial phase
      // and seed should have handled it or we need more data.
      // To align with SMACalculator, we could collect initial prices here too.
      // However, typical EMA usage starts after an initial SMA.
      // Let's stick to the formula: EMA_today = Price_today * k + EMA_yesterday * (1-k)
      // If this.ema is null, it implies we don't have EMA_yesterday.
      // The seed method is responsible for setting the first EMA.
      // If update is called and ema is null, it means not enough data yet from seeding.
      return null; 
    }
    this.ema = price * this.k + this.ema * (1 - this.k);
    return this.ema;
  }

  getResult(): number | null {
    return this.ema;
  }
}


/**
 * RSI を逐次計算するクラス
 */
export class RsiCalculator {
  private avgGain = 0;
  private avgLoss = 0;
  private prevPrice: number | null = null;
  private count = 0;
  private rsi: number | null = null;

  constructor(private readonly period: number) {
    if (period <= 0) {
      throw new Error("Period must be a positive integer.");
    }
  }

  seed(prices: number[]): void {
    this.avgGain = 0;
    this.avgLoss = 0;
    this.prevPrice = null;
    this.count = 0; // How many data points have been processed for initial avg calculation
    this.rsi = null;

    if (prices.length < this.period + 1) {
      // Not enough data to calculate initial RSI
      return;
    }

    let firstGains = 0;
    let firstLosses = 0;

    // Calculate initial sum of gains and losses for the first 'period' changes
    for (let i = 1; i <= this.period; i++) {
      const diff = prices[i] - prices[i-1];
      if (diff >= 0) {
        firstGains += diff;
      } else {
        firstLosses -= diff; // losses are positive values
      }
    }
    
    this.avgGain = firstGains / this.period;
    this.avgLoss = firstLosses / this.period;
    this.prevPrice = prices[this.period];
    this.count = this.period; // Mark that initial averages are calculated

    // Smooth for the rest of the seed data
    for (let i = this.period + 1; i < prices.length; i++) {
      const price = prices[i];
      const diff = price - this.prevPrice;
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      
      this.avgGain = (this.avgGain * (this.period - 1) + gain) / this.period;
      this.avgLoss = (this.avgLoss * (this.period - 1) + loss) / this.period;
      this.prevPrice = price;
    }

    // Calculate RSI based on the final seeded averages
    if (this.avgLoss === 0) {
      this.rsi = 100;
    } else {
      const rs = this.avgGain / this.avgLoss;
      this.rsi = 100 - 100 / (1 + rs);
    }
  }


  /**
   * 価格を更新して RSI を返す
   * @param price - 現在価格
   * @returns RSI 値または null
   */
  update(price: number): number | null {
    if (this.prevPrice === null) {
      this.prevPrice = price; // Initialize prevPrice if it's the very first update and seed was empty
      return null;
    }

    const diff = price - this.prevPrice;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    this.prevPrice = price;

    if (this.count < this.period) {
      this.avgGain += gain;
      this.avgLoss += loss;
      this.count += 1;
      if (this.count < this.period) {
        this.rsi = null;
        return null;
      }
      // First time period is complete, calculate initial average
      this.avgGain /= this.period;
      this.avgLoss /= this.period;
    } else {
      // Subsequent updates use smoothing
      this.avgGain = (this.avgGain * (this.period - 1) + gain) / this.period;
      this.avgLoss = (this.avgLoss * (this.period - 1) + loss) / this.period;
    }

    if (this.avgLoss === 0) {
      this.rsi = 100; // Prevent division by zero; RSI is 100 if all losses are zero
    } else {
      const rs = this.avgGain / this.avgLoss;
      this.rsi = 100 - 100 / (1 + rs);
    }
    return this.rsi;
  }

  getResult(): number | null {
    return this.rsi;
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

