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
  ma1: LineData<UTCTimestamp>[];
  ma2: LineData<UTCTimestamp>[];
  ma3: LineData<UTCTimestamp>[];
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
    ma1: [],
    ma2: [],
    ma3: [],
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

    // 複数のSMAを計算
    const sma1 = new SMACalculator(settings.ma.ma1);
    const sma2 = new SMACalculator(settings.ma.ma2);
    const sma3 = new SMACalculator(settings.ma.ma3);
    
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

    const ma1: LineData<UTCTimestamp>[] = [];
    const ma2: LineData<UTCTimestamp>[] = [];
    const ma3: LineData<UTCTimestamp>[] = [];
    const rsiArr: LineData<UTCTimestamp>[] = [];
    const macdArr: LineData<UTCTimestamp>[] = [];
    const signalArr: LineData<UTCTimestamp>[] = [];
    const histArr: LineData<UTCTimestamp>[] = [];
    const bollUpper: LineData<UTCTimestamp>[] = [];
    const bollLower: LineData<UTCTimestamp>[] = [];

    for (let i = 0; i < closes.length; i++) {
      const price = closes[i];
      const time = times[i];
      
      // 複数のSMAを更新
      const sma1Val = sma1.update(price);
      if (sma1Val !== null) ma1.push({ time, value: sma1Val });
      
      const sma2Val = sma2.update(price);
      if (sma2Val !== null) ma2.push({ time, value: sma2Val });
      
      const sma3Val = sma3.update(price);
      if (sma3Val !== null) ma3.push({ time, value: sma3Val });
      
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
      ma1,
      ma2,
      ma3,
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

