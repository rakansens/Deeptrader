"use client";

import { IChartApi, ISeriesApi } from "lightweight-charts";
import { useEffect, useRef, useCallback, useState, CSSProperties } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import useChartTheme from "@/hooks/use-chart-theme";
import useCandlestickData from "@/hooks/use-candlestick-data";
import useCandlestickSeries from "@/hooks/use-candlestick-series";
import useIndicatorSeries from "@/hooks/use-indicator-series";
import useChartInstance from "@/hooks/use-chart-instance";
import useWindowSize from "@/hooks/use-window-size";
import useDrawingControls from "@/hooks/use-drawing-controls";
import RsiPanel from "./RsiPanel";
import MacdPanel from "./MacdPanel";
import DrawingCanvas from "./drawing-canvas";
import type {
  DrawingCanvasHandle,
  DrawingMode,
  IndicatorOptions,
  IndicatorsChangeHandler,
} from "@/types/chart";
import type { IndicatorSettings } from "@/types/chart";
import { DEFAULT_INDICATOR_SETTINGS, DRAWING_MODES } from "@/types/chart";
import ChartSidebar from "./ChartSidebar";
import SidebarToggleButton from "./sidebar-toggle-button";
import EraserSizeControl from "./eraser-size-control";
import CandleCountdown from "./CandleCountdown";
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
}: CandlestickChartProps) {
  const themeColors = useChartTheme();
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
  } = useDrawingControls({ containerRef, drawingEnabled });
  const { width } = useWindowSize();

  // 画面幅に応じて高さを調整する
  const chartHeight =
    width > 0 && width < 768 ? Math.floor(width * 0.6) : height;

  /*
   * 選択モード以外でもマウスホイールでチャートのズームを行えるように、
   * wheel イベントをチャート本体へ転送するユーティリティ。
   *
   * 1. 描画モード中  : オーバーレイ(div)がイベントを取得するため転送が必要
   * 2. 選択モード(null): オーバーレイ自体を pointer-events:none にするので転送不要
   */

  // 描画キャンバスは常に有効にして内容を保持する
  const isDrawingEnabled = true;

  // チャートインスタンスをグローバルに露出（スクリーンショット用）
  // 意図的にTSエラーを抑制（window拡張の代替策）
  /* eslint-disable @typescript-eslint/no-explicit-any */
  if (typeof window !== "undefined") {
    // チャートインスタンスを保存するグローバル変数
    (window as any).__chartInstance = null;

    // DOMからチャート要素を取得するヘルパー関数も追加
    (window as any).__getChartElement = () => {
      const container = document.querySelector(
        '[data-testid="chart-container"]',
      );
      return container;
    };
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const {
    candles = [],
    volumes = [],
    ma = [],
    rsi = [],
    macd = [],
    signal = [],
    histogram = [],
    bollUpper = [],
    bollLower = [],
    loading,
    error,
  } = useCandlestickData(initialSymbol, initialInterval, indicatorSettings);

  const chartRef = useChartInstance({
    container: containerRef.current,
    height: chartHeight,
  });

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
    }
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

  const [countdownBgColor, setCountdownBgColor] = useState<string | undefined>();
  const [countdownTextColor, setCountdownTextColor] = useState<string>("#ffffff");

  useEffect(() => {
    if (candles.length > 0 && themeColors) {
      const latestCandle = candles[candles.length - 1];
      if (!latestCandle) return;

      setCountdownBgColor(
        latestCandle.close >= latestCandle.open
          ? themeColors.upColor
          : themeColors.downColor
      );
    }
  }, [candles, themeColors]);

  useEffect(() => {
    logger.debug("描画モード変更:", mode);
  }, [mode]);

  // チャートインスタンスをグローバルに保存（スクリーンショット用）
  useEffect(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    // チャートインスタンスの変更を監視し、グローバル変数に保存
    const checkAndSaveChart = () => {
      if (typeof window !== "undefined") {
        if (chartRef.current) {
          (window as any).__chartInstance = chartRef.current;
          logger.debug(
            "Chart instance saved for screenshots:",
            chartRef.current,
          );
        } else {
          logger.warn("Chart instance is null, cannot save for screenshots");
        }
      }
    };

    // 即時実行と300ms後の実行で確実に保存
    checkAndSaveChart();
    const timer = setTimeout(checkAndSaveChart, 300);

    return () => {
      clearTimeout(timer);
      if (typeof window !== "undefined") {
        (window as any).__chartInstance = null;
        logger.debug("Chart instance cleared from global");
      }
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [chartRef.current]);

  useEffect(() => {
    logger.debug("描画有効状態変更:", drawingEnabled);
    if (!drawingEnabled && drawingRef.current) {
      drawingRef.current.clear();
    }
  }, [drawingEnabled]);

  // インジケーターのトグル処理を最適化
  const handleToggleIndicator = useCallback(
    (key: keyof typeof indicators, value: boolean) => {
      if (onIndicatorsChange) {
        // パネルの追加/削除時にチャートのリサイズをデバウンスするため
        // requestAnimationFrameを使用して次のフレームで更新
        requestAnimationFrame(() => {
          onIndicatorsChange?.({ ...indicators, [key]: value });
        });
      }
    },
    [indicators, onIndicatorsChange],
  );

  if (loading && useApi)
    return <Skeleton data-testid="loading" className="w-full h-[300px]" />;
  if (error && useApi)
    return (
      <div data-testid="error" className="text-center text-sm text-red-500">
        {error}
      </div>
    );

  const subHeight = chartHeight * 0.25;

  return (
    <div className={className} id="chart-panel">
      <div className="flex flex-col space-y-4">
        <div className="relative w-full h-full">
          <div
            ref={containerRef}
            className="w-full rounded-md overflow-hidden border border-border"
            style={{ height: chartHeight }}
            data-testid="chart-container"
          />

          {!loading && !error && candles.length > 0 && (
            <CandleCountdown
              interval={initialInterval}
              backgroundColor={countdownBgColor}
              textColor={countdownTextColor}
              className="absolute top-2 right-16 z-20"
            />
          )}

          <SidebarToggleButton open={showSidebar} onToggle={toggleSidebar} />
          {showSidebar && (
            <ChartSidebar
              mode={mode}
              onModeChange={handleModeChange}
              onClear={handleClearDrawing}
              className="absolute top-12 left-2 z-20"
            />
          )}
          {mode === DRAWING_MODES[6] && (
            <EraserSizeControl
              size={eraserSize}
              onChange={setEraserSize}
              className="absolute top-2 right-2 z-30 w-[180px]"
            />
          )}
          <div
            className={`absolute inset-0 z-10 overflow-hidden ${mode === null ? "pointer-events-none" : ""}`}
            onWheel={handleWheel}
          >
            <DrawingCanvas
              ref={drawingRef}
              enabled={isDrawingEnabled}
              className="w-full h-full"
              color={drawingColor}
              strokeWidth={2}
              mode={mode}
              eraserSize={eraserSize}
            />
          </div>
        </div>
        {indicators.rsi && (
          <RsiPanel
            data={rsi}
            chart={chartRef.current}
            height={subHeight}
            lineWidth={indicatorSettings.lineWidth.rsi}
            color={indicatorSettings.colors?.rsi}
            onClose={() => handleToggleIndicator("rsi", false)}
          />
        )}
        {indicators.macd && (
          <MacdPanel
            macd={macd}
            signal={signal}
            histogram={histogram}
            chart={chartRef.current}
            height={subHeight}
            lineWidth={indicatorSettings.lineWidth.macd}
            macdColor={indicatorSettings.colors?.macd}
            onClose={() => handleToggleIndicator("macd", false)}
          />
        )}
      </div>
    </div>
  );
}
