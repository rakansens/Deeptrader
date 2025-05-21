"use client";

import { memo } from "react";
import type { IChartApi } from "lightweight-charts";
import CrosshairTooltip from "./CrosshairTooltip";
import RsiPanel from "./RsiPanel";
import MacdPanel from "./MacdPanel";
import ChartSidebar from "./ChartSidebar";
import SidebarToggleButton from "./sidebar-toggle-button";
import EraserSizeControl from "./eraser-size-control";
import CandleCountdown from "./CandleCountdown";
import DrawingCanvas from "./drawing-canvas";
import { DRAWING_MODES } from "@/types/chart";
import type {
  DrawingCanvasHandle,
  DrawingMode,
  IndicatorOptions,
} from "@/types/chart";
import type { IndicatorSettings, Timeframe } from "@/constants/chart";
import type { CrosshairInfo } from "@/hooks/use-crosshair-info";
import type { MutableRefObject } from "react";

export interface MainChartPanelProps {
  containerRef: React.RefObject<HTMLDivElement>;
  chartHeight: number;
  candles: any[];
  loading: boolean;
  error: string | null;
  initialInterval: Timeframe;
  crosshairInfo: CrosshairInfo | null;
  showSidebar: boolean;
  mode: DrawingMode;
  drawingRef: React.RefObject<DrawingCanvasHandle>;
  countdownBgColor?: string;
  countdownTextColor: string;
  eraserSize: number;
  handleWheel: (e: React.WheelEvent<any>) => void;
  toggleSidebar: () => void;
  handleModeChange: (mode: DrawingMode) => void;
  handleClearDrawing: () => void;
  registerShortcuts: () => void;
  unregisterShortcuts: () => void;
  setEraserSize: (size: number) => void;
  drawingColor: string;
  onDrawingColorChange: (color: string) => void;
  indicators: IndicatorOptions;
  handleToggleIndicator: (key: keyof IndicatorOptions, value: boolean) => void;
  chartRef: MutableRefObject<IChartApi | null>;
  rsi: any[];
  macd: any[];
  signal: any[];
  histogram: any[];
  subHeight: number;
  indicatorSettings: IndicatorSettings;
}

/**
 * メインチャートとインジケーター表示をまとめたパネル
 */
function MainChartPanelComponent({
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
  registerShortcuts,
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
}: MainChartPanelProps) {
  return (
    <div className="flex flex-col flex-1 space-y-4">
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
        <CrosshairTooltip info={crosshairInfo} />
        <SidebarToggleButton open={showSidebar} onToggle={toggleSidebar} />
        {showSidebar && (
          <ChartSidebar
            mode={mode}
            onModeChange={handleModeChange}
            onClear={handleClearDrawing}
            drawingColor={drawingColor}
            onColorChange={onDrawingColorChange}
            registerShortcuts={registerShortcuts}
            unregisterShortcuts={unregisterShortcuts}
            className="absolute top-12 left-2 z-20"
          />
        )}
        {mode === DRAWING_MODES.ERASER && (
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
            enabled={true}
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
          rsiUpper={indicatorSettings.rsiUpper}
          rsiLower={indicatorSettings.rsiLower}
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
  );
}

export default memo(MainChartPanelComponent);
