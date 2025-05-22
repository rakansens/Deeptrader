import { useMemo } from 'react';
import type { IChartApi, ISeriesApi, LineData, DeepPartial, LineWidth } from "lightweight-charts";
import useLineSeries from "./use-line-series";
import { preprocessLineData } from '@/lib/chart-utils';

interface UseIndicatorSeriesParams {
  chart: IChartApi | null;
  ma1Ref: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  ma2Ref: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  ma3Ref: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  bollUpperRef: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  bollLowerRef: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  ma1: LineData[];
  ma2: LineData[];
  ma3: LineData[];
  bollUpper: LineData[];
  bollLower: LineData[];
  enabledMa: boolean;
  enabledBoll: boolean;
  lineWidth: {
    ma: number;
    ma1?: number;
    ma2?: number;
    ma3?: number;
    boll: number;
  };
  colors: {
    ma1?: string;
    ma2?: string;
    ma3?: string;
    boll?: string;
  };
}

/**
 * 指標ラインシリーズの管理を行うフック
 */
export function useIndicatorSeries({
  chart,
  ma1Ref,
  ma2Ref,
  ma3Ref,
  bollUpperRef,
  bollLowerRef,
  ma1,
  ma2,
  ma3,
  bollUpper,
  bollLower,
  enabledMa,
  enabledBoll,
  lineWidth,
  colors,
}: UseIndicatorSeriesParams) {
  const processedMa1 = useMemo(() => preprocessLineData(ma1), [ma1]);
  const processedMa2 = useMemo(() => preprocessLineData(ma2), [ma2]);
  const processedMa3 = useMemo(() => preprocessLineData(ma3), [ma3]);
  const processedBollUpper = useMemo(() => preprocessLineData(bollUpper), [bollUpper]);
  const processedBollLower = useMemo(() => preprocessLineData(bollLower), [bollLower]);

  // MA1（短期移動平均線）
  useLineSeries({
    chart,
    ref: ma1Ref,
    enabled: enabledMa,
    options: { 
      color: colors?.ma1,
      lineWidth: (lineWidth.ma1 ?? lineWidth.ma) as DeepPartial<LineWidth>,
      priceLineVisible: false
    },
    data: processedMa1,
  });

  // MA2（中期移動平均線）
  useLineSeries({
    chart,
    ref: ma2Ref,
    enabled: enabledMa,
    options: { 
      color: colors?.ma2,
      lineWidth: (lineWidth.ma2 ?? lineWidth.ma) as DeepPartial<LineWidth>,
      priceLineVisible: false
    },
    data: processedMa2,
  });

  // MA3（長期移動平均線）
  useLineSeries({
    chart,
    ref: ma3Ref,
    enabled: enabledMa,
    options: { 
      color: colors?.ma3,
      lineWidth: (lineWidth.ma3 ?? lineWidth.ma) as DeepPartial<LineWidth>,
      priceLineVisible: false
    },
    data: processedMa3,
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
    data: processedBollUpper,
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
    data: processedBollLower,
  });
}

export default useIndicatorSeries;
