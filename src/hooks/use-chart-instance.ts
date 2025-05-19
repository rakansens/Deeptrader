import { useEffect, useRef } from "react";
import { createChart, CrosshairMode, IChartApi } from "lightweight-charts";
import useChartTheme from "./use-chart-theme";

interface UseChartInstanceParams {
  container: HTMLDivElement | null;
  height: number;
}

/**
 * チャートインスタンスの生成と更新を管理するフック
 */
export function useChartInstance({
  container,
  height,
}: UseChartInstanceParams) {
  const colors = useChartTheme();
  const chartRef = useRef<IChartApi | null>(null);

  // チャート生成とリサイズ管理
  useEffect(() => {
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
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
      if (chartRef.current) {
        chartRef.current.resize(container.clientWidth, height);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [container, height, colors]);

  // テーマカラー変更時のオプション更新
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
  }, [colors]);

  return chartRef;
}

export default useChartInstance;
