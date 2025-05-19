"use client";
import { useRef, useCallback, useEffect } from "react";
import {
  IChartApi,
  ISeriesApi,
  LineData,
  HistogramData,
  UTCTimestamp,
} from "lightweight-charts";
import IndicatorPanel from "./IndicatorPanel";
import { useIndicatorChart } from "@/hooks/use-indicator-chart";
import useChartTheme from "@/hooks/use-chart-theme";
import { preprocessLineData, toNumericTime, processTimeSeriesData } from "@/lib/chart-utils";

interface MacdPanelProps {
  macd: LineData[];
  signal: LineData[];
  histogram: LineData[];
  chart: IChartApi | null;
  height: number;
  onClose?: () => void;
}

/**
 * MACDパネルコンポーネント
 */
export default function MacdPanel({
  macd,
  signal,
  histogram,
  chart,
  height,
  onClose,
}: MacdPanelProps) {
  const chartRef = useRef<IChartApi | null>(null);
  const macdRef = useRef<ISeriesApi<"Line"> | null>(null);
  const signalRef = useRef<ISeriesApi<"Line"> | null>(null);
  const histRef = useRef<ISeriesApi<"Histogram"> | null>(null);
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
      chart: macdChart,
      series,
      cleanup,
    } = createIndicatorChart(containerRef.current, {
      color: "#2962FF",
      lineWidth: 2,
      title: "MACD",
      priceLineVisible: false,
      lastValueVisible: true,
    });
    chartRef.current = macdChart;

    macdRef.current = series;
    signalRef.current = macdChart.addLineSeries({
      color: "#FF6D00",
      lineWidth: 2,
      title: "Signal",
      priceLineVisible: false,
      lastValueVisible: true,
    });
    histRef.current = macdChart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: { type: "price" },
      priceScaleId: "right",
      priceLineVisible: false,
      lastValueVisible: false,
    });

    return () => {
      cleanup();
      chartRef.current = null;
      macdRef.current = null;
      signalRef.current = null;
      histRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!macdRef.current) return;
    if (macd && macd.length > 0) {
      macdRef.current.setData(preprocessLineData(macd));
    } else {
      macdRef.current.setData([
        { time: toNumericTime(Date.now()) as UTCTimestamp, value: 0 },
      ]);
    }
  }, [macd]);

  useEffect(() => {
    if (!signalRef.current) return;
    if (signal && signal.length > 0) {
      signalRef.current.setData(preprocessLineData(signal));
    } else {
      signalRef.current.setData([
        { time: toNumericTime(Date.now()) as UTCTimestamp, value: 0 },
      ]);
    }
  }, [signal]);

  useEffect(() => {
    if (!histRef.current) return;

    if (histogram && histogram.length > 0) {
      const histData: HistogramData[] = histogram.map((h) => ({
        time: h.time,
        value: h.value as number,
        color: (h.value as number) >= 0 ? "#26a69a" : "#ef5350",
      }));
      histRef.current.setData(processTimeSeriesData(histData, toNumericTime));
      return;
    }

    if (!macd || !signal || macd.length === 0 || signal.length === 0) {
      histRef.current.setData([
        { time: toNumericTime(Date.now()) as UTCTimestamp, value: 0, color: "#26a69a" },
      ]);
      return;
    }

    const diffHist: HistogramData[] = macd
      .map((m, idx) => {
        if (idx < signal.length) {
          const diff = (m.value as number) - (signal[idx].value as number);
          return {
            time: m.time,
            value: diff,
            color: diff >= 0 ? "#26a69a" : "#ef5350",
          };
        }
        return null;
      })
      .filter(Boolean) as HistogramData[];

    histRef.current.setData(processTimeSeriesData(diffHist, toNumericTime));
  }, [histogram, macd, signal]);

  return (
    <IndicatorPanel
      title="MACD"
      height={height}
      onClose={onClose}
      initChart={initChart}
    />
  );
}
