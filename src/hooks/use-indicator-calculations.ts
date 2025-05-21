import { useEffect, useState } from "react";
import {
  CandlestickData,
  LineData,
  HistogramData,
  UTCTimestamp,
} from "lightweight-charts";
import {
  SMACalculator,
  RsiCalculator,
  MACDCalculator,
  BollingerBandsCalculator,
} from "@/lib/indicators";
import type { IndicatorSettings } from "@/constants/chart";

export interface IndicatorSeriesState {
  ma: LineData<UTCTimestamp>[];
  rsi: LineData<UTCTimestamp>[];
  macd: LineData<UTCTimestamp>[];
  signal: LineData<UTCTimestamp>[];
  histogram: LineData<UTCTimestamp>[];
  bollUpper: LineData<UTCTimestamp>[];
  bollLower: LineData<UTCTimestamp>[];
}

/**
 * ローソク足データからインジケータ系列を計算するフック
 */
export function useIndicatorCalculations(
  candles: CandlestickData<UTCTimestamp>[],
  settings: IndicatorSettings,
): IndicatorSeriesState {
  const [series, setSeries] = useState<IndicatorSeriesState>(() => ({
    ma: [],
    rsi: [],
    macd: [],
    signal: [],
    histogram: [],
    bollUpper: [],
    bollLower: [],
  }));

  useEffect(() => {
    const closes = candles.map((c) => c.close);
    const times = candles.map((c) => c.time);

    const sma = new SMACalculator(settings.sma);
    const rsi = new RsiCalculator(settings.rsi);
    const macd = new MACDCalculator(
      settings.macd.short,
      settings.macd.long,
      settings.macd.signal,
    );
    const boll = new BollingerBandsCalculator(
      settings.boll.period,
      settings.boll.stdDev,
    );

    const ma: LineData<UTCTimestamp>[] = [];
    const rsiArr: LineData<UTCTimestamp>[] = [];
    const macdArr: LineData<UTCTimestamp>[] = [];
    const signalArr: LineData<UTCTimestamp>[] = [];
    const histArr: LineData<UTCTimestamp>[] = [];
    const bollUpper: LineData<UTCTimestamp>[] = [];
    const bollLower: LineData<UTCTimestamp>[] = [];

    for (let i = 0; i < closes.length; i++) {
      const price = closes[i];
      const time = times[i];
      const smaVal = sma.update(price);
      if (smaVal !== null) ma.push({ time, value: smaVal });
      const rsiVal = rsi.update(price);
      if (rsiVal !== null) rsiArr.push({ time, value: rsiVal });
      const macdVal = macd.update(price);
      if (macdVal !== null) {
        macdArr.push({ time, value: macdVal.macd });
        signalArr.push({ time, value: macdVal.signal });
        histArr.push({ time, value: macdVal.histogram });
      }
      const bollVal = boll.update(price);
      if (bollVal !== null) {
        bollUpper.push({ time, value: bollVal.upper });
        bollLower.push({ time, value: bollVal.lower });
      }
    }

    setSeries({
      ma,
      rsi: rsiArr,
      macd: macdArr,
      signal: signalArr,
      histogram: histArr,
      bollUpper,
      bollLower,
    });
  }, [candles, settings]);

  return series;
}

export default useIndicatorCalculations;

