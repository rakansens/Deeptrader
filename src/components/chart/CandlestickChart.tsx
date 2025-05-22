"use client";

// [変更点]
// ・シンボル(symbol)/時間枠(interval)切り替え時に旧データが残るバグを修正。
//   - currentSymbol/currentInterval の useState を削除し、props を直接使用。
//   - これによりチャートスケールとオーダーブックの不整合を解消。

import { IChartApi, ISeriesApi } from "lightweight-charts";
import { useEffect, useRef, useCallback, useState, CSSProperties, useMemo } from "react";
import ChartSkeleton from "./chart-skeleton";
import useChartTheme from "@/hooks/chart/use-chart-theme";
import useCandlestickData, {
  type UseCandlestickDataResult,
} from "@/hooks/chart/use-candlestick-data";
import useCandlestickSeries from "@/hooks/chart/use-candlestick-series";
import useIndicatorSeries from "@/hooks/chart/use-indicator-series";
import useChartInstance from "@/hooks/chart/use-chart-instance";
import useWindowSize from "@/hooks/use-window-size";
import useDrawingControls from "@/hooks/chart/use-drawing-controls";
import useCrosshairInfo from "@/hooks/chart/use-crosshair-info";
import useCountdownColor from "@/hooks/chart/use-countdown-color";
import OrderBookPanel from "./OrderBookPanel";
import OrderBookToggleButton from "./orderbook-toggle-button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type {
  DrawingCanvasHandle,
  DrawingMode,
  IndicatorOptions,
  IndicatorsChangeHandler,
  CrosshairInfo,
} from "@/types/chart";
import { DEFAULT_INDICATOR_SETTINGS } from "@/constants/chart";
import type { IndicatorSettings } from "@/constants/chart";
import MainChartPanel, { MainChartPanelProps } from "./MainChartPanel";
import { logger } from "@/lib/logger";
import {
  SYMBOLS,
  TIMEFRAMES,
  type SymbolValue,
  type Timeframe,
} from "@/constants/chart";

interface CandlestickChartProps {
  className?: string;
  height?: number;
  symbol?: SymbolValue;
  interval?: Timeframe;
  useApi?: boolean;
  indicators?: IndicatorOptions;
  onIndicatorsChange?: IndicatorsChangeHandler;
  /** インジケーター計算期間 */
  indicatorSettings?: IndicatorSettings;
  /** 描画キャンバスを有効にするか */
  drawingEnabled?: boolean;
  /** 描画色 */
  drawingColor?: string;
  /** 色変更ハンドラ */
  onDrawingColorChange?: (color: string) => void;
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
  indicatorSettings = DEFAULT_INDICATOR_SETTINGS,
  drawingEnabled = false,
  drawingColor = "#ef4444",
  onDrawingColorChange = () => {},
}: CandlestickChartProps) {
  const themeColors = useChartTheme();
  const [showOrderBook, setShowOrderBook] = useState(true);
  // props の値をそのまま使用し、シンボル/時間枠変更時のラグをなくす
  const currentSymbol = initialSymbol;
  const currentInterval = initialInterval;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const maRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bollUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bollLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  const {
    drawingRef,
    mode,
    eraserSize,
    showSidebar,
    strokeWidth,
    opacity,
    setEraserSize,
    handleModeChange,
    handleClearDrawing,
    toggleSidebar,
    handleWheel,
    registerShortcuts: registerDrawingShortcuts,
    unregisterShortcuts,
  } = useDrawingControls({ containerRef, drawingEnabled });

  const memoizedRegisterShortcuts = useCallback(() => {
    registerDrawingShortcuts();
  }, [registerDrawingShortcuts]);

  useEffect(() => {
    return () => {
      unregisterShortcuts();
    };
  }, [unregisterShortcuts]);

  const { width } = useWindowSize();

  const chartHeight =
    width > 0 && width < 768 ? Math.floor(width * 0.6) : height;

  const isDrawingEnabled = true;

  // 更新したsymbolとintervalを使用
  const {
    candles,
    volumes,
    ma,
    rsi,
    macd,
    signal,
    histogram,
    bollUpper,
    bollLower,
    loading,
    error,
  }: UseCandlestickDataResult = useCandlestickData(
    currentSymbol,
    currentInterval,
    indicatorSettings,
  );

  const chartRef = useChartInstance({
    container: containerRef.current,
    height: chartHeight,
  });

  // チャートインスタンスが変わった時にデータを再設定
  useEffect(() => {
    // チャートを最適化して再描画
    if (chartRef.current) {
      chartRef.current.resize(
        containerRef.current?.clientWidth || 0,
        chartHeight,
      );
    }
  }, [chartRef.current, chartHeight]);

  useIndicatorSeries({
    chart: chartRef.current,
    maRef,
    bollUpperRef,
    bollLowerRef,
    ma,
    bollUpper,
    bollLower,
    enabledMa: indicators.ma,
    enabledBoll: !!indicators.boll,
    lineWidth: {
      ma: indicatorSettings.lineWidth.ma,
      boll: indicatorSettings.lineWidth.boll,
    },
    colors: {
      ma: indicatorSettings.colors?.ma,
      boll: indicatorSettings.colors?.boll,
    },
  });

  useCandlestickSeries({
    chart: chartRef.current,
    candleRef,
    volumeRef,
    candles,
    volumes,
    colors: {
      upColor: themeColors.upColor,
      downColor: themeColors.downColor,
      volume: themeColors.volume,
    },
  });

  const crosshairInfo: CrosshairInfo | null = useCrosshairInfo({
    chart: chartRef.current,
    candleSeries: candleRef.current,
    volumeSeries: volumeRef.current,
  });

  const handleToggleIndicator = useCallback(
    (key: keyof typeof indicators, value: boolean) => {
      if (onIndicatorsChange) {
        requestAnimationFrame(() => {
          onIndicatorsChange?.({ ...indicators, [key]: value });
        });
      }
    },
    [indicators, onIndicatorsChange],
  );

  const latestCandle = useMemo(
    () => (candles.length > 0 ? candles[candles.length - 1] : null),
    [candles],
  );

  const currentPrice = useMemo(
    () => (latestCandle ? latestCandle.close : undefined),
    [latestCandle],
  );

  const { backgroundColor: countdownBgColor, textColor: countdownTextColor } =
    useCountdownColor(candles, themeColors);

  const subHeight = 100;

  const handleOrderBookToggle = useCallback(() => {
    setShowOrderBook((prev) => !prev);
    requestAnimationFrame(() => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.resize(
          containerRef.current.clientWidth,
          chartHeight,
        );
      }
    });
  }, [chartHeight]);

  // Loading
  if (loading && candles.length === 0) {
    return <ChartSkeleton style={{ height: chartHeight }} />;
  }

  // Error
  if (error && candles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">
          データの取得に失敗しました: {error}
        </div>
      </div>
    );
  }

  const mainChartPanel = (
    <MainChartPanel
      containerRef={containerRef}
      chartHeight={chartHeight}
      candles={candles}
      loading={loading}
      error={error}
      initialInterval={currentInterval}
      crosshairInfo={crosshairInfo}
      showSidebar={showSidebar}
      mode={mode}
      drawingRef={drawingRef}
      countdownBgColor={countdownBgColor}
      countdownTextColor={countdownTextColor}
      eraserSize={eraserSize}
      handleWheel={handleWheel}
      toggleSidebar={toggleSidebar}
      handleModeChange={handleModeChange}
      handleClearDrawing={handleClearDrawing}
      registerShortcuts={memoizedRegisterShortcuts}
      unregisterShortcuts={unregisterShortcuts}
      setEraserSize={setEraserSize}
      drawingColor={drawingColor}
      onDrawingColorChange={onDrawingColorChange}
      indicators={indicators}
      handleToggleIndicator={handleToggleIndicator}
      chartRef={chartRef}
      rsi={rsi}
      macd={macd}
      signal={signal}
      histogram={histogram}
      subHeight={subHeight}
      indicatorSettings={indicatorSettings}
    />
  );

  return (
    <div className={className} id="chart-panel">
      {showOrderBook ? (
        <ResizablePanelGroup
          direction="horizontal"
          className="w-full gap-4"
          onLayout={() => {
            if (chartRef.current && containerRef.current) {
              chartRef.current.resize(
                containerRef.current.clientWidth,
                chartHeight,
              );
            }
          }}
        >
          <ResizablePanel minSize={60} defaultSize={75}>
            {mainChartPanel}
          </ResizablePanel>
          <ResizableHandle className="w-[2px] bg-border hover:bg-primary/50 transition-colors" />
          <ResizablePanel minSize={15} defaultSize={25}>
            <OrderBookPanel
              symbol={currentSymbol}
              height={chartHeight}
              currentPrice={currentPrice}
              className="w-[250px] flex-shrink-0"
              onClose={handleOrderBookToggle}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="relative">
          {mainChartPanel}
          <OrderBookToggleButton
            onToggle={handleOrderBookToggle}
            className="absolute top-2 right-2 z-30"
          />
        </div>
      )}
    </div>
  );
}
