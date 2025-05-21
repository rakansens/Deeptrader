import { useEffect, useRef } from "react";
import { createChart, CrosshairMode, IChartApi } from "lightweight-charts";
import useChartTheme from "./use-chart-theme";
import { logger } from "@/lib/logger";
import { setActiveChartForCapture } from "@/lib/chart-capture-service";

interface UseChartInstanceParams {
  container: HTMLDivElement | null;
  height: number;
}

/**
 * `_private__container` を参照できるようにした IChartApi 拡張インターフェース
 */
interface ChartWithContainer extends IChartApi {
  /** LightweightCharts 内部で管理されているコンテナ要素 */
  _private__container?: HTMLElement;
}

/**
 * チャートインスタンスの生成と更新を管理するフック
 * Lightweight Charts v4.1.3+ の機能に対応
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

    // チャートの作成
    logger.debug('Creating chart instance');
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
    
    // チャートインスタンスを保存
    chartRef.current = chart;
    setActiveChartForCapture(chart, container); // Register active chart
    logger.debug('Chart instance created, saved to ref, and set for capture');

    // takeScreenshotメソッドの存在確認
    if ('takeScreenshot' in chart) {
      logger.debug('Lightweight Charts takeScreenshot method available');
    } else {
      logger.warn('Lightweight Charts takeScreenshot method not found in chart object properties');
      
      // メソッドをモンキーパッチとして追加（可能な場合）
      try {
        if (typeof (chart as ChartWithContainer).takeScreenshot !== 'function') {
          // canvasを取得する簡易スクリーンショット機能を実装
          (chart as ChartWithContainer).takeScreenshot = async function() {
            logger.debug('Using custom takeScreenshot implementation');
            const container = (chart as ChartWithContainer)._private__container;
            if (container) {
              const canvas = container.querySelector('canvas');
              if (canvas) {
                // 新しいキャンバスにコピーして返す
                const newCanvas = document.createElement('canvas');
                newCanvas.width = canvas.width;
                newCanvas.height = canvas.height;
                const ctx = newCanvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(canvas, 0, 0);
                }
                return newCanvas;
              }
            }
            throw new Error('Canvas element not found in chart container');
          };
          logger.debug('Added custom takeScreenshot method to chart instance');
        }
      } catch (e) {
        logger.error('Failed to add custom takeScreenshot method:', e);
      }
    }

    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.resize(container.clientWidth, height);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      setActiveChartForCapture(null, null); // Unregister active chart
      logger.debug('Removing chart instance');
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
