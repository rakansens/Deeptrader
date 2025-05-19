'use client'

import {
  createChart,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
} from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import useChartTheme from '@/hooks/use-chart-theme'
import useCandlestickData from '@/hooks/use-candlestick-data'
import useCandlestickSeries from '@/hooks/use-candlestick-series'
import useLineSeries from '@/hooks/use-line-series'
import RsiPanel from './RsiPanel'
import MacdPanel from './MacdPanel'
import DrawingCanvas, { DrawingCanvasHandle, DrawingMode } from './drawing-canvas'
import ChartSidebar from './ChartSidebar'
import type {
  IndicatorOptions,
  IndicatorsChangeHandler,
} from './types'
import { SYMBOLS, TIMEFRAMES } from '@/constants/chart'

interface CandlestickChartProps {
  className?: string;
  height?: number;
  symbol?: string;
  interval?: string;
  useApi?: boolean;
  indicators?: IndicatorOptions;
  onIndicatorsChange?: IndicatorsChangeHandler;
  /** 描画キャンバスを有効にするか */
  drawingEnabled?: boolean;
  /** 描画色 */
  drawingColor?: string;
}

/**
 * Binanceのローソク足を表示するチャート
 */
export default function CandlestickChart({
  className,
  height = 400,
  symbol: initialSymbol = SYMBOLS[0].value,
  interval: initialInterval = TIMEFRAMES[0],
  useApi = false,
  indicators = { ma: false, rsi: false, macd: false, boll: false },
  onIndicatorsChange,
  drawingEnabled = false,
  drawingColor = "#ef4444",
}: CandlestickChartProps) {
  const colors = useChartTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const maRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bollUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bollLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  const drawingRef = useRef<DrawingCanvasHandle>(null);
  const [mode, setMode] = useState<DrawingMode | null>(null);

  const isDrawingEnabled = mode !== null;

  const {
    candles = [],
    volumes = [],
    ma = [],
    rsi = [],
    macd = [],
    signal = [],
    bollUpper = [],
    bollLower = [],
    loading,
    error,
  } = useCandlestickData(initialSymbol, initialInterval);

  useLineSeries({
    chart: chartRef.current,
    ref: maRef,
    enabled: indicators.ma,
    options: { color: '#f59e0b', lineWidth: 2, priceLineVisible: false },
    data: ma,
  });
  useLineSeries({
    chart: chartRef.current,
    ref: bollUpperRef,
    enabled: !!indicators.boll,
    options: { color: '#a855f7', lineWidth: 1, priceLineVisible: false },
    data: bollUpper,
  });
  useLineSeries({
    chart: chartRef.current,
    ref: bollLowerRef,
    enabled: !!indicators.boll,
    options: { color: '#a855f7', lineWidth: 1, priceLineVisible: false },
    data: bollLower,
  });

  useCandlestickSeries({
    chart: chartRef.current,
    candleRef,
    volumeRef,
    candles,
    volumes,
    colors: {
      upColor: colors.upColor,
      downColor: colors.downColor,
      volume: colors.volume,
    },
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: colors.crosshair,
          labelVisible: true,
          labelBackgroundColor: colors.background,
        },
        horzLine: {
          color: colors.crosshair,
          labelVisible: true,
          labelBackgroundColor: colors.background,
        },
      },
      rightPriceScale: {
        borderColor: colors.grid,
        borderVisible: true,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: { borderColor: colors.grid, timeVisible: true },
    });
    chartRef.current = chart;
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(containerRef.current.clientWidth, height);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [colors, height]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: colors.crosshair,
          labelVisible: true,
          labelBackgroundColor: colors.background,
        },
        horzLine: {
          color: colors.crosshair,
          labelVisible: true,
          labelBackgroundColor: colors.background,
        },
      },
      rightPriceScale: { borderColor: colors.grid },
      timeScale: { borderColor: colors.grid },
    });
    // シリーズのテーマはフック内で適用
  }, [colors]);

  useEffect(() => {
    console.log('描画モード変更:', mode);
    if (mode === null && drawingRef.current) {
      drawingRef.current.clear();
    }
  }, [mode]);

  // 型安全なモード変更ハンドラー
  const handleModeChange = (newMode: DrawingMode) => {
    setMode(newMode);
  };

  if (loading && useApi)
    return <Skeleton data-testid="loading" className="w-full h-[300px]" />;
  if (error && useApi)
    return (
      <div data-testid="error" className="text-center text-sm text-red-500">
        {error}
      </div>
    );

  const subHeight = height * 0.25;

  return (
    <div className={className}>
      <div className="flex flex-col space-y-4">
        <div className="relative w-full h-full">
          <div
            ref={containerRef}
            className="w-full rounded-md overflow-hidden border border-border"
            style={{ height }}
            data-testid="chart-container"
          />
          <ChartSidebar
            mode={mode}
            onModeChange={handleModeChange}
            className="absolute top-2 left-2 z-20"
          />
          <DrawingCanvas
            ref={drawingRef}
            enabled={isDrawingEnabled}
            className="absolute inset-0 z-10"
            color={drawingColor}
            strokeWidth={2}
            mode={mode}
          />
        </div>
        {indicators.rsi && (
          <RsiPanel
            data={rsi}
            chart={chartRef.current}
            height={subHeight}
            onClose={() => onIndicatorsChange?.({ ...indicators, rsi: false })}
          />
        )}
        {indicators.macd && (
          <MacdPanel
            macd={macd}
            signal={signal}
            chart={chartRef.current}
            height={subHeight}
            onClose={() => onIndicatorsChange?.({ ...indicators, macd: false })}
          />
        )}
      </div>
    </div>
  );
}
