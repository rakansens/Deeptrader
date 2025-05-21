import html2canvas from 'html2canvas'
import { IChartApi } from 'lightweight-charts'
import { logger } from '@/lib/logger'
import { getActiveChartInstanceForCapture, getActiveChartElementForCapture } from '@/lib/chart-capture-service'

// 型定義は専用ファイルに移動済み（src/types/lightweight-charts.d.ts）

/**
 * チャート要素からキャンバスとその親要素を取得する
 * 価格表示を含めたキャプチャのため
 */
async function getChartCanvasWithPriceScale(): Promise<HTMLElement | null> {
  try {
    // まず新しいAPIでチャート要素を取得
    const chartElement = getActiveChartElementForCapture();
    if (chartElement) {
      logger.debug('Found chart container element via capture service');
      return chartElement;
    }
    
    // 後方互換性のため、古い方法も試す
    // DOMからチャート要素を直接取得
    const getChartElement = window.__getChartElement;
    if (typeof getChartElement === 'function') {
      const chartElement = getChartElement();
      if (chartElement) {
        logger.debug('Found chart container element via legacy method');
        // チャートのコンテナ要素全体を返す（価格スケールを含む）
        return chartElement;
      }
    }
    
    // 直接DOM検索でチャートコンテナを見つける
    const chartContainer = document.querySelector('[data-testid="chart-container"]');
    if (chartContainer) {
      logger.debug('Found chart container by direct DOM query');
      return chartContainer as HTMLElement;
    }
    
    // チャートパネル全体を対象にする
    const chartPanel = document.getElementById('chart-panel');
    if (chartPanel) {
      logger.debug('Found chart panel element');
      return chartPanel;
    }
    
    return null;
  } catch (e) {
    logger.error('Error finding chart element:', e);
    return null;
  }
}

/**
 * チャートのcanvas要素を直接キャプチャする代替手段
 */
async function captureChartCanvas(): Promise<HTMLCanvasElement | null> {
  try {
    // チャート要素を取得
    const chartElement = await getChartCanvasWithPriceScale();
    if (!chartElement) return null;
    
    // canvas要素を見つける
    const canvases = chartElement.querySelectorAll('canvas');
    if (canvases.length > 0) {
      logger.debug(`Found ${canvases.length} canvas elements in chart`);
      
      // メインキャンバス（通常は一番大きいもの）を選択
      let mainCanvas = canvases[0];
      let maxArea = mainCanvas.width * mainCanvas.height;
      
      for (let i = 1; i < canvases.length; i++) {
        const canvas = canvases[i];
        const area = canvas.width * canvas.height;
        if (area > maxArea) {
          maxArea = area;
          mainCanvas = canvas;
        }
      }
      
      logger.debug('Selected main canvas for capture');
      
      // 新しいキャンバスにコピーして返す
      const newCanvas = document.createElement('canvas');
      newCanvas.width = mainCanvas.width;
      newCanvas.height = mainCanvas.height;
      const ctx = newCanvas.getContext('2d');
      ctx?.drawImage(mainCanvas, 0, 0);
      return newCanvas;
    }
    
    logger.warn('No canvas elements found in chart');
    return null;
  } catch (e) {
    logger.error('Error capturing chart canvas directly:', e);
    return null;
  }
}

/**
 * キャプチャ対象としてチャートカード全体を取得する
 * これによりヘッダーの時間足/銘柄/インジケーター切替も含めてキャプチャできる
 */
function getChartCardElement(): HTMLElement | null {
  const chartPanel = document.getElementById('chart-panel');
  if (!chartPanel) return null;
  // Card > CardContent > CandlestickChart の階層想定
  // chartPanel -> parentElement (CardContent) -> parentElement (div) -> closest Card
  let el: HTMLElement | null = chartPanel;
  for (let i = 0; i < 4 && el; i++) {
    if (el.classList.contains('rounded-lg') && el.classList.contains('border')) {
      return el;
    }
    el = el.parentElement as HTMLElement | null;
  }
  // クラス判定に失敗した場合は2階層上を返す
  return chartPanel.parentElement?.parentElement as HTMLElement | null;
}

/**
 * チャートパネルをキャプチャしてPNGデータURLを返す
 * 
 * 1. Lightweight Chartsのネイティブスクリーンショット機能を優先使用
 * 2. canvas要素を直接キャプチャする代替手段を試行
 * 3. 失敗した場合はhtml2canvasにフォールバック
 */
export async function captureChart(): Promise<string | null> {
  try {
    logger.debug('Chart screenshot requested');
    
    // 新しいAPIでチャートインスタンスを取得
    const chartInstance = getActiveChartInstanceForCapture();
    
    // 後方互換性のために古い参照方法も確認
    const legacyChartInstance = window.__chartInstance;
    
    // 使用するチャートインスタンス
    const activeChart = chartInstance || legacyChartInstance;
    
    // チャートインスタンスのデバッグ情報
    if (activeChart) {
      logger.debug('Chart instance found:', !!activeChart);
    } else {
      logger.warn('Chart instance not found, cannot use native screenshot');
    }
    
    // 方法0: Card全体をhtml2canvasでキャプチャ (最優先)
    logger.debug('Trying to capture card element via html2canvas');
    const cardElement = getChartCardElement();
    if (cardElement) {
      try {
        await new Promise(r => setTimeout(r, 100));
        const cardCanvas = await html2canvas(cardElement, {
          allowTaint: true,
          useCORS: true,
          scale: 2,
          logging: false,
          backgroundColor: null,
        });
        logger.debug('Captured chart card successfully');
        return cardCanvas.toDataURL('image/png', 1.0);
      } catch (e) {
        logger.error('Card capture via html2canvas failed:', e);
      }
    }
    
    // 方法1: Lightweight Charts のネイティブスクリーンショット機能を使用
    if (activeChart) {
      logger.debug('Using Lightweight Charts native screenshot API');

      try {
        // レンダリングの完了を保証するために少し待機
        await new Promise(resolve => setTimeout(resolve, 200));

        // チャートコンテナがまだDOMに存在するか確認
        const el = getActiveChartElementForCapture() || (window as any).__getChartElement?.();
        if (!el || !document.contains(el)) {
          logger.warn('Chart container not attached; skipping native screenshot');
        } else if (typeof activeChart.takeScreenshot === 'function') {
          // チャートスクリーンショットをPNG画像としてエクスポート
          const canvas = await activeChart.takeScreenshot();
          logger.debug('Chart screenshot successful via native API');

          // 高品質なPNG画像を生成（品質1.0、最高画質）
          return canvas.toDataURL('image/png', 1.0);
        } else {
          logger.warn('takeScreenshot method not found on chart instance, falling back');
        }
      } catch (error) {
        logger.error('Native chart screenshot failed:', error);
      }
    }
    
    // 方法2: canvas要素を直接キャプチャする代替手段
    logger.debug('Trying to capture chart canvas directly');
    try {
      // チャート要素全体を取得（価格表示を含む）
      const chartElement = await getChartCanvasWithPriceScale();
      
      if (chartElement) {
        // まずcanvasの直接キャプチャを試みる
        const canvas = await captureChartCanvas();
        if (canvas) {
          logger.debug('Chart canvas captured directly');
          return canvas.toDataURL('image/png', 1.0);
        }
        
        // canvas取得に失敗した場合、要素全体をhtml2canvasでキャプチャ
        logger.debug('Falling back to html2canvas with chart element');
        const fullCanvas = await html2canvas(chartElement, {
          allowTaint: true,
          useCORS: true,
          scale: 2, // 高解像度
          logging: false,
          foreignObjectRendering: false,
          removeContainer: false,
          backgroundColor: null, // 透過背景
          ignoreElements: (element: Element) => {
            // チャート以外の要素を無視（ツールバーやサイドバーなど）
            return element.classList.contains('ignore-screenshot');
          }
        });
        
        logger.debug('Chart element captured via html2canvas');
        return fullCanvas.toDataURL('image/png', 1.0);
      }
    } catch (error) {
      logger.error('Direct element capture failed:', error);
    }
    
    // 方法3: チャートパネル全体をhtml2canvas方式でキャプチャ（最終手段）
    logger.debug('Falling back to chart panel html2canvas method');
    const chartPanel = document.getElementById('chart-panel');
    if (!chartPanel) {
      logger.error('Chart panel element not found');
      return null;
    }

    // レンダリング完了のために短い遅延を入れる
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const canvas = await html2canvas(chartPanel as HTMLElement, {
      allowTaint: true,
      useCORS: true,
      scale: 2, // 高解像度
      logging: false,
      backgroundColor: null, // 透過背景
      ignoreElements: (element: Element) => {
        // チャート以外の要素を無視（ツールバーやサイドバーなど）
        return element.classList.contains('ignore-screenshot');
      },
      onclone: (documentClone: Document) => {
        logger.debug('Capturing chart panel via html2canvas...');
        
        // 複製されたDOMでも価格スケールが表示されるように調整
        const panelClone = documentClone.getElementById('chart-panel');
        if (panelClone) {
          // スタイル調整（表示を確実にする）
          const priceScales = panelClone.querySelectorAll('.price-scale');
          priceScales.forEach(scale => {
            (scale as HTMLElement).style.visibility = 'visible';
            (scale as HTMLElement).style.display = 'block';
          });
        }
        
        return documentClone;
      }
    });
    
    logger.debug('Chart screenshot successful via html2canvas');
    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    logger.error('Screenshot capture failed:', error);
    return null;
  }
}

