// src/lib/chart/capture.ts
// チャートキャプチャ機能統合 - Phase 2統合 (capture-chart + chart-capture-service) + Phase 5A型統合

import html2canvas from 'html2canvas'
import type { IChartApi } from 'lightweight-charts'
import type { WindowWithChart } from '@/types'
import { logger } from '@/lib/logger'
import { Point } from '@/types'
import { CHART_CAPTURE_SCALE } from '@/constants/ui'

// =============================================================================
// 🔗 アクティブチャート管理 (旧: chart-capture-service.ts)
// =============================================================================

let activeChart: IChartApi | null = null;
let activeChartElement: HTMLElement | null = null;

export const setActiveChartForCapture = (
  chart: IChartApi | null,
  element: HTMLElement | null,
): void => {
  activeChart = chart;
  activeChartElement = element;
};

export const getActiveChartInstanceForCapture = (): IChartApi | null => {
  return activeChart;
};

export const getActiveChartElementForCapture = (): HTMLElement | null => {
  return activeChartElement;
};

// =============================================================================
// 📸 チャートキャプチャ機能 (旧: capture-chart.ts)
// =============================================================================

/**
 * チャートカード要素を取得する
 */
export function getChartCardElement(): HTMLElement | null {
  const chartPanel = document.getElementById('chart-panel')
  if (!chartPanel) return null
  let el: HTMLElement | null = chartPanel
  for (let i = 0; i < 4 && el; i++) {
    if (el.classList.contains('rounded-lg') && el.classList.contains('border')) {
      return el
    }
    el = el.parentElement as HTMLElement | null
  }
  return chartPanel.parentElement?.parentElement as HTMLElement | null
}

/**
 * html2canvas を用いたキャプチャ
 */
export async function captureViaHtml2Canvas(
  element: HTMLElement
): Promise<string | null> {
  try {
    await new Promise(r => setTimeout(r, 100))
    const options = {
      scale: CHART_CAPTURE_SCALE,
      quality: 0.95,
      useCORS: true,
      allowTaint: false,
    };
    const canvas = await html2canvas(element, options)
    
    const MAX_WIDTH = 800
    if (canvas.width > MAX_WIDTH) {
      const scaledCanvas = document.createElement('canvas')
      const ratio = MAX_WIDTH / canvas.width
      scaledCanvas.width = MAX_WIDTH
      scaledCanvas.height = canvas.height * ratio
      const ctx = scaledCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, scaledCanvas.width, scaledCanvas.height)
        return scaledCanvas.toDataURL('image/png', 0.9)
      }
    }
    
    return canvas.toDataURL('image/png', 0.9)
  } catch (e) {
    logger.error('html2canvas capture failed:', e)
    return null
  }
}

/**
 * Lightweight Charts のネイティブAPIによるキャプチャ
 */
export async function captureViaNativeApi(
  chart: IChartApi | null | undefined
): Promise<string | null> {
  if (!chart) return null
  try {
    await new Promise(r => setTimeout(r, 200))
    const el =
      getActiveChartElementForCapture() ||
      (window as WindowWithChart).__getChartElement?.()
    if (!el || !document.contains(el)) {
      logger.warn('Chart container not attached; skipping native screenshot')
      return null
    }
    const takeScreenshot = (
      chart as IChartApi & {
        takeScreenshot?: (this: IChartApi) => Promise<HTMLCanvasElement>
      }
    ).takeScreenshot
    if (typeof takeScreenshot === 'function') {
      const canvas = await takeScreenshot.call(chart)
      return canvas.toDataURL('image/png', 1.0)
    }
    return null
  } catch (e) {
    logger.error('Native chart screenshot failed:', e)
    return null
  }
}

/**
 * チャートのスクリーンショットを取得
 */
export async function captureChart(): Promise<string | null> {
  const card = getChartCardElement()
  if (card) {
    const url = await captureViaHtml2Canvas(card)
    if (url) return url
  }

  const chart =
    getActiveChartInstanceForCapture() || (window as WindowWithChart).__chartInstance
  const native = await captureViaNativeApi(chart)
  if (native) return native

  const panel = document.getElementById('chart-panel')
  if (panel) {
    return captureViaHtml2Canvas(panel)
  }

  logger.error('Chart panel element not found')
  return null
} 