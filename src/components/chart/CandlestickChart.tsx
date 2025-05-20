"use client";

import { IChartApi, ISeriesApi } from "lightweight-charts";
import { useEffect, useRef, useCallback } from "react";
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
import type { IndicatorOptions, IndicatorsChangeHandler } from "@/types/chart";
import ChartSidebar from "./ChartSidebar";
import SidebarToggleButton from "./sidebar-toggle-button";
import EraserSizeControl from "./eraser-size-control";
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
  const chartHeight = width > 0 && width < 768 ? Math.floor(width * 0.6) : height;

  /*
   * 選択モード以外でもマウスホイールでチャートのズームを行えるように、
   * wheel イベントをチャート本体へ転送するユーティリティ。
   *
   * 1. 描画モード中  : オーバーレイ(div)がイベントを取得するため転送が必要
   * 2. 選択モード(null): オーバーレイ自体を pointer-events:none にするので転送不要
   */

  // 描画キャンバスは常に有効にして内容を保持する
  const isDrawingEnabled = true;

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
  } = useCandlestickData(initialSymbol, initialInterval);

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
    logger.debug('描画モード変更:', mode);
  }, [mode]);

  useEffect(() => {
    logger.debug('描画有効状態変更:', drawingEnabled);
    if (!drawingEnabled && drawingRef.current) {
      drawingRef.current.clear();
    }
  }, [drawingEnabled]);

  // インジケーターのトグル処理を最適化
  const handleToggleIndicator = useCallback((key: keyof typeof indicators, value: boolean) => {
    if (onIndicatorsChange) {
      // パネルの追加/削除時にチャートのリサイズをデバウンスするため
      // requestAnimationFrameを使用して次のフレームで更新
      requestAnimationFrame(() => {
        onIndicatorsChange?.({ ...indicators, [key]: value });
      });
    }
  }, [indicators, onIndicatorsChange]);


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
    <div className={className}>
      <div className="flex flex-col space-y-4">
        <div className="relative w-full h-full">
          <div
            ref={containerRef}
            className="w-full rounded-md overflow-hidden border border-border"
            style={{ height: chartHeight }}
            data-testid="chart-container"
          />
          
          <SidebarToggleButton open={showSidebar} onToggle={toggleSidebar} />
          {showSidebar && (
            <ChartSidebar
              mode={mode}
              onModeChange={handleModeChange}
              onClear={handleClearDrawing}
              className="absolute top-12 left-2 z-20"
            />
          )}
          {mode === 'eraser' && (
            <EraserSizeControl
              size={eraserSize}
              onChange={setEraserSize}
              className="absolute top-2 right-2 z-30 w-[180px]"
            />
          )}
          <div
            className={`absolute inset-0 z-10 overflow-hidden ${mode === null ? 'pointer-events-none' : ''}`}
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
            onClose={() => handleToggleIndicator('rsi', false)}
          />
        )}
        {indicators.macd && (
          <MacdPanel
            macd={macd}
            signal={signal}
            histogram={histogram}
            chart={chartRef.current}
            height={subHeight}
            onClose={() => handleToggleIndicator('macd', false)}
          />
        )}
      </div>
    </div>
  );
}
