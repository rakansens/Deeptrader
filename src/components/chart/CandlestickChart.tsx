'use client'

import {
  createChart,
  CandlestickData,
  HistogramData,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import useChartTheme from '@/hooks/use-chart-theme'
import useCandlestickData from '@/hooks/use-candlestick-data'
import { processTimeSeriesData, toNumericTime } from '@/lib/chart-utils'
import useLineSeries from '@/hooks/use-line-series'
import RsiPanel from './RsiPanel'
import MacdPanel from './MacdPanel'
import DrawingCanvas, { DrawingCanvasHandle } from './drawing-canvas'

interface IndicatorOptions {
  ma: boolean;
  rsi: boolean;
  macd?: boolean;
  boll?: boolean;
}

interface CandlestickChartProps {
  className?: string;
  height?: number;
  symbol?: string;
  interval?: string;
  useApi?: boolean;
  indicators?: IndicatorOptions;
  onIndicatorsChange?: (value: IndicatorOptions) => void;
  /** 描画キャンバスを有効にするか */
  drawingEnabled?: boolean;
}

/**
 * Binanceのローソク足を表示するチャート
 */
export default function CandlestickChart({
  className,
  height = 400,
  symbol: initialSymbol = "BTCUSDT",
  interval: initialInterval = "1m",
  useApi = false,
  indicators = { ma: false, rsi: false, macd: false, boll: false },
  onIndicatorsChange,
  drawingEnabled = false,
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
    candleRef.current = chart.addCandlestickSeries({
      upColor: colors.upColor,
      downColor: colors.downColor,
      wickUpColor: colors.upColor,
      wickDownColor: colors.downColor,
      borderVisible: false,
    });
    volumeRef.current = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
      color: colors.volume,
    });
    chart
      .priceScale("vol")
      .applyOptions({ scaleMargins: { top: 0.9, bottom: 0 } });
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
    candleRef.current?.applyOptions({
      upColor: colors.upColor,
      downColor: colors.downColor,
      wickUpColor: colors.upColor,
      wickDownColor: colors.downColor,
      borderVisible: false,
    });
    volumeRef.current?.applyOptions({ color: colors.volume });
  }, [colors]);

  // 描画機能が有効/無効に切り替わったときに描画履歴をクリア
  useEffect(() => {
    console.log('描画モード変更:', drawingEnabled);
    if (!drawingEnabled && drawingRef.current) {
      drawingRef.current.clear();
    }
  }, [drawingEnabled]);

  useEffect(() => {
    if (candleRef.current && candles.length > 0) {
      candleRef.current.setData(
        processTimeSeriesData<CandlestickData>(candles, toNumericTime),
      );
    }
    if (volumeRef.current && volumes.length > 0) {
      volumeRef.current.setData(
        processTimeSeriesData<HistogramData>(volumes, toNumericTime),
      );
    }
  }, [candles, volumes]);

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
          <DrawingCanvas
            ref={drawingRef}
            enabled={drawingEnabled}
            className="absolute inset-0 z-10"
            color="#ef4444"
            strokeWidth={2}
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
