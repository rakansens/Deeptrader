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
import { useIndicatorChart } from "@/hooks/chart/use-indicator-chart";
import useChartTheme from "@/hooks/chart/use-chart-theme";
import { preprocessLineData, toNumericTime } from "@/lib/chart";
import type { IndicatorSettings } from "@/constants/chart";

interface RsiPanelProps {
  data: LineData[];
  chart: IChartApi | null;
  height: number;
  onClose?: () => void;
  lineWidth?: number;
  color?: string;
  rsiUpper?: number;
  rsiLower?: number;
  indicatorSettings: IndicatorSettings;
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
  rsiUpper = 70,
  rsiLower = 30,
  indicatorSettings,
}: RsiPanelProps) {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const overSoldRef = useRef<ISeriesApi<"Line"> | null>(null);
  const overBoughtRef = useRef<ISeriesApi<"Line"> | null>(null);
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
    
    overSoldRef.current = overSoldLine;
    overBoughtRef.current = overBoughtLine;

    overSoldLine.setData([
      { time: timeFrom as UTCTimestamp, value: rsiLower },
      { time: timeTo as UTCTimestamp, value: rsiLower },
    ]);
    overBoughtLine.setData([
      { time: timeFrom as UTCTimestamp, value: rsiUpper },
      { time: timeTo as UTCTimestamp, value: rsiUpper },
    ]);

    return () => {
      cleanup();
      chartRef.current = null;
      seriesRef.current = null;
      overSoldRef.current = null;
      overBoughtRef.current = null;
    };
  }, [createIndicatorChart, color, lineWidth]);

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

  useEffect(() => {
    if (!overSoldRef.current || !overBoughtRef.current) return;
    const timeFrom = toNumericTime(Date.now()) - 60 * 60 * 24 * 30;
    const timeTo = toNumericTime(Date.now()) + 60 * 60 * 24;
    overSoldRef.current.setData([
      { time: timeFrom as UTCTimestamp, value: rsiLower },
      { time: timeTo as UTCTimestamp, value: rsiLower },
    ]);
    overBoughtRef.current.setData([
      { time: timeFrom as UTCTimestamp, value: rsiUpper },
      { time: timeTo as UTCTimestamp, value: rsiUpper },
    ]);
  }, [rsiUpper, rsiLower]);

  // 線の太さと色が変更された時に反映する
  useEffect(() => {
    if (!seriesRef.current) return;
    
    console.log('RSI: 色と線幅を更新:', { color, lineWidth });
    
    // RSIシリーズのスタイルを更新（安全性チェック追加）
    try {
      if (seriesRef.current && typeof seriesRef.current.applyOptions === 'function') {
        seriesRef.current.applyOptions({
          lineWidth: lineWidth as any,
          color
        });
      }
    } catch (error) {
      console.warn('RSI applyOptions failed:', error);
    }
  }, [lineWidth, color]);

  return (
    <IndicatorPanel
      title="RSI"
      height={height}
      onClose={onClose}
      initChart={initChart}
    />
  );
}
