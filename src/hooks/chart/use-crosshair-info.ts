import { useEffect, useRef, useState } from "react";
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  UTCTimestamp,
  MouseEventParams,
} from "lightweight-charts";
import type { CrosshairInfo } from "@/types/chart";

interface UseCrosshairInfoParams {
  chart: IChartApi | null;
  candleSeries: ISeriesApi<"Candlestick"> | null;
  volumeSeries?: ISeriesApi<"Histogram"> | null;
}

/**
 * subscribeCrosshairMove を利用してクロスヘア位置の情報を取得するフック
 */
export function useCrosshairInfo({
  chart,
  candleSeries,
  volumeSeries,
}: UseCrosshairInfoParams) {
  const [info, setInfo] = useState<CrosshairInfo | null>(null);
  const lastRef = useRef<CrosshairInfo | null>(null);

  useEffect(() => {
    if (!chart || !candleSeries) return;

    const handler = (param: MouseEventParams) => {
      if (!param.time) {
        if (lastRef.current !== null) {
          lastRef.current = null;
          setInfo(null);
        }
        return;
      }

      const candle = param.seriesData.get(candleSeries) as
        | CandlestickData<UTCTimestamp>
        | undefined;

      if (!candle) {
        if (lastRef.current !== null) {
          lastRef.current = null;
          setInfo(null);
        }
        return;
      }

      const vol = volumeSeries
        ? ((
            param.seriesData.get(volumeSeries) as
              | HistogramData<UTCTimestamp>
              | undefined
          )?.value ?? undefined)
        : undefined;
      const change = candle.close - candle.open;
      const percent = candle.open !== 0 ? (change / candle.open) * 100 : 0;

      const next: CrosshairInfo = {
        time: param.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: vol,
        change,
        changePercent: percent,
      };

      const prev = lastRef.current;
      const changed =
        !prev ||
        prev.time !== next.time ||
        prev.open !== next.open ||
        prev.high !== next.high ||
        prev.low !== next.low ||
        prev.close !== next.close ||
        prev.volume !== next.volume ||
        prev.change !== next.change ||
        prev.changePercent !== next.changePercent;

      if (changed) {
        lastRef.current = next;
        setInfo(next);
      }
    };

    chart.subscribeCrosshairMove(handler);
    return () => {
      chart.unsubscribeCrosshairMove(handler);
    };
  }, [chart, candleSeries, volumeSeries]);

  return info;
}

export default useCrosshairInfo;
