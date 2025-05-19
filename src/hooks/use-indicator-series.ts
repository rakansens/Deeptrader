import type { IChartApi, ISeriesApi, LineData } from "lightweight-charts";
import useLineSeries from "./use-line-series";

interface UseIndicatorSeriesParams {
  chart: IChartApi | null;
  maRef: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  bollUpperRef: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  bollLowerRef: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  ma: LineData[];
  bollUpper: LineData[];
  bollLower: LineData[];
  enabledMa: boolean;
  enabledBoll: boolean;
}

/**
 * 指標ラインシリーズの管理を行うフック
 */
export function useIndicatorSeries({
  chart,
  maRef,
  bollUpperRef,
  bollLowerRef,
  ma,
  bollUpper,
  bollLower,
  enabledMa,
  enabledBoll,
}: UseIndicatorSeriesParams) {
  useLineSeries({
    chart,
    ref: maRef,
    enabled: enabledMa,
    options: { color: "#f59e0b", lineWidth: 2, priceLineVisible: false },
    data: ma,
  });

  useLineSeries({
    chart,
    ref: bollUpperRef,
    enabled: enabledBoll,
    options: { color: "#a855f7", lineWidth: 1, priceLineVisible: false },
    data: bollUpper,
  });

  useLineSeries({
    chart,
    ref: bollLowerRef,
    enabled: enabledBoll,
    options: { color: "#a855f7", lineWidth: 1, priceLineVisible: false },
    data: bollLower,
  });
}

export default useIndicatorSeries;
