"use client";

// [変更点]
// ・シンボル(symbol)/時間枠(interval)切り替え時に旧データが残るバグを修正。
//   - currentSymbol/currentInterval の useState を削除し、props を直接使用。
//   - これによりチャートスケールとオーダーブックの不整合を解消。
// ・ツールバーをチャート内に表示し、表示/非表示を切り替えられるように変更。

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
import MainChartPanel, { MainChartPanelProps } from "./MainChartPanel";
import {
  SYMBOLS,
  TIMEFRAMES,
  type SymbolValue,
  type Timeframe,
} from "@/constants/chart";
import type {
  DrawingCanvasHandle,
  DrawingMode,
  IndicatorOptions,
  IndicatorsChangeHandler,
  CrosshairInfo,
} from "@/types/chart";
import { DEFAULT_INDICATOR_SETTINGS } from "@/constants/chart";
import type { IndicatorSettings } from "@/constants/chart";

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
  /** 価格情報更新ハンドラ */
  onPriceInfoUpdate?: (info: {
    currentPrice?: number;
    priceChange?: number;
    priceChangePercent?: number;
    ohlc?: {
      open: number;
      high: number;
      low: number;
      close: number;
      time: string;
    };
    maValues?: {
      ma7?: number;
      ma25?: number;
      ma99?: number;
    };
  }) => void;
  /** オーダーブックの表示状態 */
  showOrderBook?: boolean;
  /** オーダーブックの表示/非表示を切り替えるハンドラー */
  onOrderBookToggle?: () => void;
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
  indicators = { ma: false, rsi: true, macd: true, boll: false },
  onIndicatorsChange,
  indicatorSettings = DEFAULT_INDICATOR_SETTINGS,
  drawingEnabled = false,
  drawingColor = "#ef4444",
  onDrawingColorChange = () => {},
  onPriceInfoUpdate = () => {},
  showOrderBook = false,
  onOrderBookToggle = () => {},
}: CandlestickChartProps) {
  const themeColors = useChartTheme();
  // props の値をそのまま使用し、シンボル/時間枠変更時のラグをなくす
  const currentSymbol = initialSymbol;
  const currentInterval = initialInterval;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma1Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma2Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma3Ref = useRef<ISeriesApi<"Line"> | null>(null);
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
    ma1,
    ma2,
    ma3,
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
    enabledMa: indicators.ma,
    enabledBoll: !!indicators.boll,
    lineWidth: {
      ma: indicatorSettings.lineWidth.ma,
      ma1: indicatorSettings.lineWidth.ma1,
      ma2: indicatorSettings.lineWidth.ma2,
      ma3: indicatorSettings.lineWidth.ma3,
      boll: indicatorSettings.lineWidth.boll,
    },
    colors: {
      ma1: indicatorSettings.colors?.ma1,
      ma2: indicatorSettings.colors?.ma2,
      ma3: indicatorSettings.colors?.ma3,
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

  // インジケーターの表示領域を広げる（RSIとMACDのパネル高さ）
  const subHeight = 150;

  // 価格変動情報の計算
  const priceChange = useMemo(() => {
    if (candles.length < 2) return 0;
    return latestCandle ? latestCandle.close - candles[candles.length - 2].close : 0;
  }, [candles, latestCandle]);

  const priceChangePercent = useMemo(() => {
    if (candles.length < 2) return 0;
    const previousClose = candles[candles.length - 2].close;
    return previousClose ? (priceChange / previousClose) * 100 : 0;
  }, [candles, priceChange]);

  // 価格情報が変更されたときに親コンポーネントに通知
  useEffect(() => {
    // 最新のローソク足とMA値を計算
    const latestCandle = candles.length > 0 ? candles[candles.length - 1] : null;
    const latestTime = latestCandle ? new Date(latestCandle.time * 1000) : null;
    const formattedTime = latestTime ? 
      `${latestTime.getFullYear()}/${String(latestTime.getMonth() + 1).padStart(2, '0')}/${String(latestTime.getDate()).padStart(2, '0')} ${String(latestTime.getHours()).padStart(2, '0')}:${String(latestTime.getMinutes()).padStart(2, '0')}` 
      : '';
    
    // MA値を計算
    // 各期間のMA値を取得
    const maValues = {
      ma7: ma1.length > 0 ? ma1[ma1.length - 1]?.value : undefined,
      ma25: ma2.length > 0 ? ma2[ma2.length - 1]?.value : undefined,
      ma99: ma3.length > 0 ? ma3[ma3.length - 1]?.value : undefined
    };

    onPriceInfoUpdate({
      currentPrice: currentPrice,
      priceChange: priceChange,
      priceChangePercent: priceChangePercent,
      ohlc: latestCandle ? {
        open: latestCandle.open,
        high: latestCandle.high,
        low: latestCandle.low,
        close: latestCandle.close,
        time: formattedTime
      } : undefined,
      maValues
    });
  }, [candles, currentPrice, priceChange, priceChangePercent, ma1, ma2, ma3, onPriceInfoUpdate]);

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
      symbol={currentSymbol}
      volumes={volumes}
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
      priceChange={priceChange}
      priceChangePercent={priceChangePercent}
    />
  );

  // オーバーレイスタイルの新UI：リサイズのない高速な切り替え
  return (
    <div className={`${className} relative`} id="chart-panel">
      {/* チャート（常に100%幅で固定、リサイズなし） */}
      {mainChartPanel}

      {/* OrderBookパネルはOrderBookHoverCardコンポーネントで表示するためここでは非表示 */}
    </div>
  );
}
