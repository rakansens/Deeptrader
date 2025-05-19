"use client";

import { IChartApi, ISeriesApi } from "lightweight-charts";
import { useEffect, useRef, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import useChartTheme from "@/hooks/use-chart-theme";
import useCandlestickData from "@/hooks/use-candlestick-data";
import useCandlestickSeries from "@/hooks/use-candlestick-series";
import useIndicatorSeries from "@/hooks/use-indicator-series";
import useChartInstance from "@/hooks/use-chart-instance";
import RsiPanel from "./RsiPanel";
import MacdPanel from "./MacdPanel";
import DrawingCanvas from "./drawing-canvas";
import type {
  DrawingCanvasHandle,
  DrawingMode,
  IndicatorOptions,
  IndicatorsChangeHandler,
} from "@/types/chart";
import ChartSidebar from "./ChartSidebar";
import { logger } from "@/lib/logger";
import {
  SYMBOLS,
  TIMEFRAMES,
  type SymbolValue,
  type Timeframe,
} from "@/constants/chart";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

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
  const drawingRef = useRef<DrawingCanvasHandle>(null);
  const [mode, setMode] = useState<DrawingMode | null>(null);
  const [eraserSize, setEraserSize] = useState<number>(30);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  /*
   * 選択モード以外でもマウスホイールでチャートのズームを行えるように、
   * wheel イベントをチャート本体へ転送するユーティリティ。
   *
   * 1. 描画モード中  : オーバーレイ(div)がイベントを取得するため転送が必要
   * 2. 選択モード(null): オーバーレイ自体を pointer-events:none にするので転送不要
   */
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    // オリジナルイベントを無効化し軽量チャートへ新しいイベントを送る
    e.preventDefault();

    const cloned = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      deltaMode: e.deltaMode,
      clientX: e.clientX,
      clientY: e.clientY,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
    });

    containerRef.current.dispatchEvent(cloned);
  };

  // 描画をクリアするハンドラー
  const handleClearDrawing = () => {
    if (drawingRef.current) {
      drawingRef.current.clear();
    }
  };

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
    height,
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

  // 型安全なモード変更ハンドラー
  const handleModeChange = (newMode: DrawingMode) => {
    setMode(newMode);
  };

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

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
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
          
          {/* サイドバー表示/非表示トグルボタン - サイドバー非表示時のみ表示 */}
          {!showSidebar && (
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 left-2 z-30 w-8 h-8 p-1.5"
              onClick={toggleSidebar}
              title="サイドバーを表示"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          
          {/* サイドバーを条件付きでレンダリング - トグルボタンと同じ位置に配置 */}
          {showSidebar && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 left-2 z-30 w-8 h-8 p-1.5"
                onClick={toggleSidebar}
                title="サイドバーを非表示"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
              <ChartSidebar
                mode={mode}
                onModeChange={handleModeChange}
                onClear={handleClearDrawing}
                className="absolute top-12 left-2 z-20" // ボタンの下に配置
              />
            </>
          )}
          {mode === 'eraser' && (
            <div className="absolute top-2 right-2 bg-background/90 p-3 rounded-md border border-input z-30 flex flex-col gap-2" style={{ width: '180px' }}>
              <div className="text-xs font-medium text-muted-foreground mb-1">消しゴムサイズ</div>
              <Slider
                value={[eraserSize]}
                min={10}
                max={100}
                step={5}
                onValueChange={(values) => setEraserSize(values[0])}
              />
              <div className="text-xs text-right text-muted-foreground mt-1">{eraserSize}px</div>
            </div>
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
