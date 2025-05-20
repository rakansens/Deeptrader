"use client";
import { useRef, useCallback, useEffect } from "react";
import {
  IChartApi,
  ISeriesApi,
  LineData,
  UTCTimestamp,
  LineSeriesPartialOptions,
} from "lightweight-charts";
import IndicatorPanel from "./IndicatorPanel";
import { useIndicatorChart } from "@/hooks/use-indicator-chart";
import useChartTheme from "@/hooks/use-chart-theme";
import { preprocessLineData, toNumericTime } from "@/lib/chart-utils";

interface RsiPanelProps {
  data: LineData[];
  chart: IChartApi | null;
  height: number;
  onClose?: () => void;
  lineWidth?: number;
  color?: string;
}

/**
 * RSIパネルコンポーネント
 */
export default function RsiPanel({
  data,
  chart,
  height,
  lineWidth = 2,
  color = "#2962FF",
  onClose,
}: RsiPanelProps) {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const colors = useChartTheme();
  const createIndicatorChart = useIndicatorChart({
    height,
    colors,
    mainChart: chart,
  });

  const initChart = useCallback((el: HTMLDivElement) => {
    containerRef.current = el;
    return () => {};
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const {
      chart: rsiChart,
      series,
      cleanup,
    } = createIndicatorChart(containerRef.current, {
      color,
      lineWidth,
      title: "RSI",
      priceLineVisible: false,
      lastValueVisible: true,
    } as LineSeriesPartialOptions);
    chartRef.current = rsiChart;

    // RSI特有の設定
    seriesRef.current = series;

    const overSoldLine = rsiChart.addLineSeries({
      color: "rgba(239, 83, 80, 0.5)",
      lineWidth: 1,
      lineStyle: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const overBoughtLine = rsiChart.addLineSeries({
      color: "rgba(38, 166, 154, 0.5)",
      lineWidth: 1,
      lineStyle: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const timeFrom = toNumericTime(Date.now()) - 60 * 60 * 24 * 30;
    const timeTo = toNumericTime(Date.now()) + 60 * 60 * 24;
    overSoldLine.setData([
      { time: timeFrom as UTCTimestamp, value: 30 },
      { time: timeTo as UTCTimestamp, value: 30 },
    ]);
    overBoughtLine.setData([
      { time: timeFrom as UTCTimestamp, value: 70 },
      { time: timeTo as UTCTimestamp, value: 70 },
    ]);

    return () => {
      cleanup();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    if (data && data.length > 0) {
      seriesRef.current.setData(preprocessLineData(data));
    } else {
      seriesRef.current.setData([
        { time: toNumericTime(Date.now()) as UTCTimestamp, value: 50 },
      ]);
    }
  }, [data]);

  return (
    <IndicatorPanel
      title="RSI"
      height={height}
      onClose={onClose}
      initChart={initChart}
    />
  );
}
