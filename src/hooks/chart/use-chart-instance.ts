import { useLayoutEffect, useEffect, useRef } from "react";
import { createChart, CrosshairMode, IChartApi } from "lightweight-charts";
import useChartTheme from "./use-chart-theme";
import { logger } from "@/lib/logger";
import { setActiveChartForCapture } from "@/lib/chart-capture-service";

/**
 * 🚀 2025-05-22: ResizeObserverの改良
 * - contentRectから正確なサイズを取得して即座にresizeを反映
 * - パネル切替・サイズ変更時の空白チャートを防止
 * - fitContent()で初期ズームを最適化
 */

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
  useLayoutEffect(() => {
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
          ;(chart as ChartWithContainer).takeScreenshot = async function (
            this: IChartApi,
          ): Promise<HTMLCanvasElement> {
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

    // 古いブラウザ用のフォールバック処理
    let handleResize: (() => void) | undefined;
    
    // 正確なサイズを取得して描画を即時反映するResizeObserver
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(entries => {
        if (!chartRef.current) return;
        
        const { width, height: rectHeight } = entries[0].contentRect;
        // 偶数に切り捨てるとHi-DPIディスプレイで描画が綺麗になる
        const adjustedWidth = Math.floor(width);
        const adjustedHeight = Math.floor(rectHeight || height);
        
        // サイズが変わった時だけリサイズを実行（無限ループ防止）
        if (adjustedWidth > 0 && adjustedHeight > 0) {
          chartRef.current.resize(adjustedWidth, adjustedHeight);
          
          // リサイズ後にデータが全て表示されるようにする
          try {
            chartRef.current.timeScale().fitContent();
          } catch (e) {
            // ignore errors
          }
        }
      });
      observer.observe(container);
      
      // 初期描画のトリガーとして一度リサイズを実行
      if (chartRef.current && container.clientWidth > 0) {
        chartRef.current.resize(container.clientWidth, height);
        chartRef.current.timeScale().fitContent();
      }
    } else {
      // 古いブラウザ用のフォールバック
      handleResize = () => {
        if (chartRef.current) {
          chartRef.current.resize(container.clientWidth, height);
        }
      };
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      } else if (typeof ResizeObserver === "undefined") {
        // ResizeObserverが使えない環境でのフォールバックのクリーンアップ
        if (handleResize) {
          window.removeEventListener("resize", handleResize);
        }
      }
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
