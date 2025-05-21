"use client";

import { IChartApi, ISeriesApi } from "lightweight-charts";
import { useEffect, useRef, useCallback, useState, CSSProperties, useMemo } from "react";
import ChartSkeleton from "./chart-skeleton";
import useChartTheme from "@/hooks/use-chart-theme";
import useCandlestickData, {
  type UseCandlestickDataResult,
} from "@/hooks/use-candlestick-data";
import useCandlestickSeries from "@/hooks/use-candlestick-series";
import useIndicatorSeries from "@/hooks/use-indicator-series";
import useChartInstance from "@/hooks/use-chart-instance";
import useWindowSize from "@/hooks/use-window-size";
import useDrawingControls from "@/hooks/use-drawing-controls";
import useCrosshairInfo, {
  type CrosshairInfo,
} from "@/hooks/use-crosshair-info";
import useCountdownColor from "@/hooks/use-countdown-color";
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
    initialSymbol,
    initialInterval,
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

  useEffect(() => {
    logger.debug("描画モード変更:", mode);
  }, [mode]);

  useEffect(() => {
    logger.debug("描画有効状態変更:", drawingEnabled);
    if (!drawingEnabled && drawingRef.current) {
      drawingRef.current.clear();
    }
  }, [drawingEnabled, drawingRef]);

  if (loading && useApi)
    return <ChartSkeleton className="w-full h-[300px]" />;
  if (error && useApi)
    return (
      <div data-testid="error" className="text-center text-sm text-red-500">
        {error}
      </div>
    );

  const subHeight = chartHeight * 0.25;

  // オーダーブック表示トグル時の処理
  const handleOrderBookToggle = useCallback(() => {
    setShowOrderBook((prev) => !prev);
    // setTimeout で非同期処理するとUIが更新された後にリサイズが実行される
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 5);
  }, []);

  // メインチャートパネル用のプロパティ（メモ化）
  const chartPanelProps = useMemo<MainChartPanelProps>(
    () => ({
      containerRef,
      chartHeight,
      candles,
      loading,
      error,
      initialInterval,
      crosshairInfo,
      showSidebar,
      mode,
      drawingRef,
      countdownBgColor,
      countdownTextColor,
      eraserSize,
      handleWheel,
      toggleSidebar,
      handleModeChange,
      handleClearDrawing,
      registerShortcuts: memoizedRegisterShortcuts,
      unregisterShortcuts,
      setEraserSize,
      drawingColor,
      onDrawingColorChange,
      indicators,
      handleToggleIndicator,
      chartRef,
      rsi,
      macd,
      signal,
      histogram,
      subHeight,
      indicatorSettings,
    }),
    [
      containerRef,
      chartHeight,
      candles,
      loading,
      error,
      initialInterval,
      crosshairInfo,
      showSidebar,
      mode,
      drawingRef,
      countdownBgColor,
      countdownTextColor,
      eraserSize,
      handleWheel,
      toggleSidebar,
      handleModeChange,
      handleClearDrawing,
      memoizedRegisterShortcuts,
      unregisterShortcuts,
      setEraserSize,
      drawingColor,
      onDrawingColorChange,
      indicators,
      handleToggleIndicator,
      chartRef,
      rsi,
      macd,
      signal,
      histogram,
      subHeight,
      indicatorSettings,
    ],
  );

  // メインチャートパネル（メモ化コンポーネント使用）
  const mainChartPanel = <MainChartPanel {...chartPanelProps} />;

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
          <ResizableHandle withHandle />
          <ResizablePanel minSize={20} defaultSize={25}>
            <OrderBookPanel
              symbol={initialSymbol}
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
