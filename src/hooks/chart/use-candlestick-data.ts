import {
  CandlestickData,
  HistogramData,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";
import type { Timeframe, SymbolValue, IndicatorSettings } from "@/constants/chart";
import { DEFAULT_INDICATOR_SETTINGS } from "@/constants/chart";
import useCandlestickStream from "./use-candlestick-stream";
import useIndicatorCalculations from "./use-indicator-calculations";

export interface UseCandlestickDataResult {
  candles: CandlestickData<UTCTimestamp>[];
  volumes: HistogramData<UTCTimestamp>[];
  ma1: LineData<UTCTimestamp>[];
  ma2: LineData<UTCTimestamp>[];
  ma3: LineData<UTCTimestamp>[];
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

/**
 * ローソク足データとインジケータ計算を提供するフック
 */
export function useCandlestickData(
  symbol: SymbolValue,
  interval: Timeframe,
  settings: IndicatorSettings = DEFAULT_INDICATOR_SETTINGS,
): UseCandlestickDataResult {
  const stream = useCandlestickStream(symbol, interval);
  const indicators = useIndicatorCalculations(stream.candles, settings);

  return {
    candles: stream.candles,
    volumes: stream.volumes,
    ma1: indicators.ma1,
    ma2: indicators.ma2,
    ma3: indicators.ma3,
    rsi: indicators.rsi,
    macd: indicators.macd,
    signal: indicators.signal,
    histogram: indicators.histogram,
    bollUpper: indicators.bollUpper,
    bollLower: indicators.bollLower,
    loading: stream.loading,
    error: stream.error,
    connected: stream.connected,
  };
}

export default useCandlestickData;

