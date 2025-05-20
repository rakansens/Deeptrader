import type { IChartApi, ISeriesApi, LineData, DeepPartial, LineWidth } from "lightweight-charts";
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
  lineWidth: {
    ma: number;
    boll: number;
  };
  colors: {
    ma?: string;
    boll?: string;
  };
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
  lineWidth,
  colors,
}: UseIndicatorSeriesParams) {
  useLineSeries({
    chart,
    ref: maRef,
    enabled: enabledMa,
    options: { 
      color: colors?.ma,
      lineWidth: lineWidth.ma as DeepPartial<LineWidth>,
      priceLineVisible: false
    },
    data: ma,
  });

  useLineSeries({
    chart,
    ref: bollUpperRef,
    enabled: enabledBoll,
    options: { 
      color: colors?.boll,
      lineWidth: lineWidth.boll as DeepPartial<LineWidth>,
      priceLineVisible: false
    },
    data: bollUpper,
  });

  useLineSeries({
    chart,
    ref: bollLowerRef,
    enabled: enabledBoll,
    options: { 
      color: colors?.boll,
      lineWidth: lineWidth.boll as DeepPartial<LineWidth>,
      priceLineVisible: false
    },
    data: bollLower,
  });
}

export default useIndicatorSeries;
