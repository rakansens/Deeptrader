import { useCallback, useEffect, useRef, useState } from "react";
import {
  CandlestickData,
  HistogramData,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";
import type { BinanceKline, BinanceKlineMessage } from "@/types";
import useBinanceSocket from "./use-binance-socket";
import { upsertSeries } from "@/lib/candlestick-utils"; 
import { 
  RsiCalculator, 
  SMACalculator, 
  MACDCalculator, 
  BollingerBandsCalculator,
  EMACalculator, // Though EMACalculator is used by MACD, it's good practice if it were directly needed
} from "@/lib/indicators";
import type { IndicatorSettings } from "@/types/chart";
import { DEFAULT_INDICATOR_SETTINGS } from "@/types/chart";
import type { Timeframe, SymbolValue } from "@/constants/chart";

export interface UseCandlestickDataResult {
  candles: CandlestickData<UTCTimestamp>[];
  volumes: HistogramData<UTCTimestamp>[];
  ma: LineData<UTCTimestamp>[];
  rsi: LineData<UTCTimestamp>[];
  macd: LineData<UTCTimestamp>[];
  signal: LineData<UTCTimestamp>[];
  histogram: LineData<UTCTimestamp>[];
  bollUpper: LineData<UTCTimestamp>[];
  bollLower: LineData<UTCTimestamp>[];
  loading: boolean;
  error: string | null;
  connected: boolean;
}

interface ChartDataState {
  candles: CandlestickData<UTCTimestamp>[];
  volumes: HistogramData<UTCTimestamp>[];
  ma: LineData<UTCTimestamp>[];
  rsi: LineData<UTCTimestamp>[];
  macd: LineData<UTCTimestamp>[];
  signal: LineData<UTCTimestamp>[];
  histogram: LineData<UTCTimestamp>[];
  bollUpper: LineData<UTCTimestamp>[];
  bollLower: LineData<UTCTimestamp>[];
}

/**
 * ローソク足データを取得するフック
 * @param symbol - 通貨ペア
 * @param interval - 時間枠
 */
export function useCandlestickData(
  symbol: SymbolValue,
  interval: Timeframe,
  settings: IndicatorSettings = DEFAULT_INDICATOR_SETTINGS,
): UseCandlestickDataResult {
  const [chartData, setChartData] = useState<ChartDataState>(() => {
    let initialCandles: CandlestickData<UTCTimestamp>[] = [];
    let initialVolumes: HistogramData<UTCTimestamp>[] = [];

    try {
      const storedCandles = localStorage.getItem(`candles_${symbol}_${interval}`);
      if (storedCandles) {
        try {
          const parsedCandles = JSON.parse(storedCandles);
          // Basic validation: check if it's an array and if the first element has a 'time' property (if not empty)
          if (Array.isArray(parsedCandles) && (parsedCandles.length === 0 || (parsedCandles[0] && typeof parsedCandles[0].time === 'number'))) {
            initialCandles = parsedCandles as CandlestickData<UTCTimestamp>[];
          } else {
            console.warn(`Invalid format for cached candles (symbol: ${symbol}, interval: ${interval}). Expected array of CandlestickData.`);
            initialCandles = []; // Fallback to empty array
          }
        } catch (parseError) {
          console.warn(`Failed to parse cached candles (symbol: ${symbol}, interval: ${interval}):`, parseError);
          initialCandles = []; // Fallback to empty array on parse error
        }
      }
    } catch (e) {
      // This catches errors from localStorage.getItem itself (e.g., security restrictions)
      console.warn(`Error accessing cached candles (symbol: ${symbol}, interval: ${interval}) from localStorage:`, e);
      initialCandles = []; // Default to empty array on any localStorage access error
    }

    try {
      const storedVolumes = localStorage.getItem(`volumes_${symbol}_${interval}`);
      if (storedVolumes) {
        try {
          const parsedVolumes = JSON.parse(storedVolumes);
          // Basic validation: check if it's an array and if the first element has a 'time' property (if not empty)
          if (Array.isArray(parsedVolumes) && (parsedVolumes.length === 0 || (parsedVolumes[0] && typeof parsedVolumes[0].time === 'number'))) {
            initialVolumes = parsedVolumes as HistogramData<UTCTimestamp>[];
          } else {
            console.warn(`Invalid format for cached volumes (symbol: ${symbol}, interval: ${interval}). Expected array of HistogramData.`);
            initialVolumes = []; // Fallback to empty array
          }
        } catch (parseError) {
          console.warn(`Failed to parse cached volumes (symbol: ${symbol}, interval: ${interval}):`, parseError);
          initialVolumes = []; // Fallback to empty array on parse error
        }
      }
    } catch (e) {
      // This catches errors from localStorage.getItem itself
      console.warn(`Error accessing cached volumes (symbol: ${symbol}, interval: ${interval}) from localStorage:`, e);
      initialVolumes = []; // Default to empty array on any localStorage access error
    }

    return {
      candles: initialCandles,
      volumes: initialVolumes,
      ma: [],
      rsi: [],
      macd: [],
      signal: [],
      histogram: [],
      bollUpper: [],
      bollLower: [],
    };
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculator Refs
  const smaCalcRef = useRef<SMACalculator>(new SMACalculator(settings.sma));
  const rsiCalcRef = useRef<RsiCalculator>(new RsiCalculator(settings.rsi));
  const macdCalcRef = useRef<MACDCalculator>(
    new MACDCalculator(settings.macd.short, settings.macd.long, settings.macd.signal)
  );
  const bollBandsCalcRef = useRef<BollingerBandsCalculator>(
    new BollingerBandsCalculator(settings.boll.period, settings.boll.stdDev)
  );


  // Function to fetch initial data
  async function fetchInitialData(
    currentSymbol: SymbolValue,
    currentInterval: Timeframe,
    currentSettings: IndicatorSettings,
    signal: AbortSignal,
  ): Promise<ChartDataState> {
    const url = `https://api.binance.com/api/v3/klines?symbol=${currentSymbol}&interval=${currentInterval}&limit=500`;
    const res = await fetch(url, { signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }
    const rawKlines = (await res.json()) as BinanceKline[];

    const historicalCandles: CandlestickData<UTCTimestamp>[] = [];
    const historicalVolumes: HistogramData<UTCTimestamp>[] = [];
    const historicalClosePrices: number[] = [];

    rawKlines.forEach((d) => {
      const [openTime, open, high, low, close, vol] = d;
      const time = (openTime / 1000) as UTCTimestamp;
      historicalCandles.push({
        time, open: parseFloat(open), high: parseFloat(high), low: parseFloat(low), close: parseFloat(close),
      });
      historicalVolumes.push({
        time, value: parseFloat(vol), color: parseFloat(close) >= parseFloat(open) ? "#26a69a" : "#ef5350",
      });
      historicalClosePrices.push(parseFloat(close));
    });

    // Initialize new calculator instances based on currentSettings for seeding
    const currentSmaCalc = new SMACalculator(currentSettings.sma);
    const currentRsiCalc = new RsiCalculator(currentSettings.rsi);
    const currentMacdCalc = new MACDCalculator(currentSettings.macd.short, currentSettings.macd.long, currentSettings.macd.signal);
    const currentBollBandsCalc = new BollingerBandsCalculator(currentSettings.boll.period, currentSettings.boll.stdDev);

    // Seed calculators
    currentSmaCalc.seed(historicalClosePrices);
    currentRsiCalc.seed(historicalClosePrices);
    currentMacdCalc.seed(historicalClosePrices);
    currentBollBandsCalc.seed(historicalClosePrices);
    
    // Update refs to point to these fresh, seeded calculators
    // This is crucial if settings change, ensuring new data uses new settings.
    smaCalcRef.current = currentSmaCalc;
    rsiCalcRef.current = currentRsiCalc;
    macdCalcRef.current = currentMacdCalc;
    bollBandsCalcRef.current = currentBollBandsCalc;

    const seriesData: Omit<ChartDataState, "candles" | "volumes"> = {
      ma: [], rsi: [], macd: [], signal: [], histogram: [], bollUpper: [], bollLower: [],
    };

    // Re-iterate through historical prices to generate series data using seeded calculators
    // Note: For seeding, we call seed() once with all historical prices.
    // Then, to get the historical series, we iterate, call update() for each price,
    // and then getResult() to plot that point in time.
    
    // Create temporary calculators for series generation pass to not mess with ref's state yet.
    const tempSmaCalc = new SMACalculator(currentSettings.sma);
    const tempRsiCalc = new RsiCalculator(currentSettings.rsi);
    const tempMacdCalc = new MACDCalculator(currentSettings.macd.short, currentSettings.macd.long, currentSettings.macd.signal);
    const tempBollBandsCalc = new BollingerBandsCalculator(currentSettings.boll.period, currentSettings.boll.stdDev);

    for (let i = 0; i < historicalClosePrices.length; i++) {
      const price = historicalClosePrices[i];
      const time = historicalCandles[i].time;

      const smaVal = tempSmaCalc.update(price);
      if (smaVal !== null) seriesData.ma.push({ time, value: smaVal });

      const rsiVal = tempRsiCalc.update(price);
      if (rsiVal !== null) seriesData.rsi.push({ time, value: rsiVal });

      const macdVal = tempMacdCalc.update(price);
      if (macdVal !== null) {
        seriesData.macd.push({ time, value: macdVal.macd });
        seriesData.signal.push({ time, value: macdVal.signal });
        seriesData.histogram.push({ time, value: macdVal.histogram });
      }

      const bollVal = tempBollBandsCalc.update(price);
      if (bollVal !== null) {
        seriesData.bollUpper.push({ time, value: bollVal.upper });
        // Middle band from bollinger can be pushed if needed, or use SMA directly
        seriesData.bollLower.push({ time, value: bollVal.lower });
      }
    }
    
    return {
      candles: historicalCandles,
      volumes: historicalVolumes,
      ...seriesData,
    };
  }

  // 初期データ取得
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      
      // When settings change, we need to re-initialize calculators for fetchInitialData
      // The refs will be updated by fetchInitialData itself.
      // Reset all series data, including candles and volumes from localStorage,
      // as new settings might mean new data interpretation or different history requirements.
      // However, the prompt implies candles/volumes from localStorage are kept if possible.
      // For now, let's keep the previous behavior of clearing indicators but keeping candles/volumes.
      setChartData((prev) => ({
        candles: prev.candles, // Keep potentially localStorage-loaded candles
        volumes: prev.volumes, // Keep potentially localStorage-loaded volumes
        ma: [],
        rsi: [],
        macd: [],
        signal: [],
        histogram: [],
        bollUpper: [],
        bollLower: [],
      }));

      try {
        const initialData = await fetchInitialData(symbol, interval, settings, controller.signal);
        if (!controller.signal.aborted) {
          setChartData(initialData); // This will set all data including candles and volumes from fetch
          try {
            localStorage.setItem(
              `candles_${symbol}_${interval}`, // Use current symbol/interval from hook params for storage keys
              JSON.stringify(initialData.candles),
            );
          } catch (e) {
            console.warn(`Failed to save candles to localStorage (symbol: ${symbol}, interval: ${interval}):`, e);
          }
          try {
            localStorage.setItem(
              `volumes_${symbol}_${interval}`, // Use current symbol/interval from hook params for storage keys
              JSON.stringify(initialData.volumes),
            );
          } catch (e) {
            console.warn(`Failed to save volumes to localStorage (symbol: ${symbol}, interval: ${interval}):`, e);
          }
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError((e as Error).message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [symbol, interval, settings]);

  // WebSocketメッセージ処理
  const handleMessage = useCallback(
    (msg: BinanceKlineMessage) => {
      if (!msg.k) return;
      const k = msg.k;
      const time = (k.t / 1000) as UTCTimestamp;
      const candle: CandlestickData<UTCTimestamp> = {
        time,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
      };
      setChartData((prev) => {
        const updatedCandles = upsertSeries(prev.candles, candle, 500);
        try {
          localStorage.setItem(
            `candles_${symbol}_${interval}`,
            JSON.stringify(updatedCandles),
          );
        } catch (e) {
          console.warn(`Failed to save candles to localStorage during WebSocket update (symbol: ${symbol}, interval: ${interval}):`, e);
        }
        const volume: HistogramData<UTCTimestamp> = {
          time,
          value: parseFloat(k.v),
          color: parseFloat(k.c) >= parseFloat(k.o) ? "#26a69a" : "#ef5350",
        };
        const updatedVolumes = upsertSeries(prev.volumes, volume, 500);
        try {
          localStorage.setItem(
            `volumes_${symbol}_${interval}`,
            JSON.stringify(updatedVolumes),
          );
        } catch (e) {
          console.warn(`Failed to save volumes to localStorage during WebSocket update (symbol: ${symbol}, interval: ${interval}):`, e);
        }
        // pricesRef is no longer used for indicator calculation.
        // If it was used for something else, that needs to be reviewed.
        // For now, assume it's removed or handled elsewhere if still needed.
        
        const currentPrice = parseFloat(k.c);
        // The calculator refs (smaCalcRef.current, etc.) are updated by fetchInitialData
        // when settings change, or they hold the latest state from previous updates.
        // So, we directly use them here.

        const smaResult = smaCalcRef.current.update(currentPrice);
        const rsiResult = rsiCalcRef.current.update(currentPrice);
        const macdResult = macdCalcRef.current.update(currentPrice);
        const bollResult = bollBandsCalcRef.current.update(currentPrice);

        const newMaSeries = smaResult !== null ? upsertSeries(prev.ma, { time, value: smaResult }, 500) : prev.ma;
        const newRsiSeries = rsiResult !== null ? upsertSeries(prev.rsi, { time, value: rsiResult }, 500) : prev.rsi;
        
        let newMacdSeries = prev.macd;
        let newSignalSeries = prev.signal;
        let newHistogramSeries = prev.histogram;
        if (macdResult !== null) {
          newMacdSeries = upsertSeries(prev.macd, { time, value: macdResult.macd }, 500);
          newSignalSeries = upsertSeries(prev.signal, { time, value: macdResult.signal }, 500);
          newHistogramSeries = upsertSeries(prev.histogram, { time, value: macdResult.histogram }, 500);
        }

        let newBollUpperSeries = prev.bollUpper;
        let newBollLowerSeries = prev.bollLower;
        // Also update MA series if Bollinger's middle band is used as the primary MA
        let maSeriesForBoll = newMaSeries; 

        if (bollResult !== null) {
          newBollUpperSeries = upsertSeries(prev.bollUpper, { time, value: bollResult.upper }, 500);
          newBollLowerSeries = upsertSeries(prev.bollLower, { time, value: bollResult.lower }, 500);
          // Example: If you decide Bollinger's middle is the MA to display
          // maSeriesForBoll = upsertSeries(prev.ma, { time, value: bollResult.middle }, 500);
        }
        
        return {
          ...prev,
          candles: updatedCandles,
          volumes: updatedVolumes,
          ma: maSeriesForBoll, // Use maSeriesForBoll if MA is derived from Bollinger
          rsi: newRsiSeries,
          macd: newMacdSeries,
          signal: newSignalSeries,
          histogram: newHistogramSeries,
          bollUpper: newBollUpperSeries,
          bollLower: newBollLowerSeries,
        };
      });
    },
    [symbol, interval], // settings dependency removed as calculators are now in refs and updated via useEffect/fetchInitialData
  );

  const { status } = useBinanceSocket<BinanceKlineMessage>({
    url: `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`,
    onMessage: handleMessage,
    enabled: !loading && !error,
  });

  return {
    candles: chartData.candles,
    volumes: chartData.volumes,
    ma: chartData.ma,
    rsi: chartData.rsi,
    macd: chartData.macd,
    signal: chartData.signal,
    histogram: chartData.histogram,
    bollUpper: chartData.bollUpper,
    bollLower: chartData.bollLower,
    loading,
    error,
    connected: status === "connected",
  };
}

export default useCandlestickData;
