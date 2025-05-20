import html2canvas from 'html2canvas'
import { IChartApi } from 'lightweight-charts'
import { logger } from '@/lib/logger'

// 型定義は専用ファイルに移動済み（src/types/lightweight-charts.d.ts）

/**
 * チャートのcanvas要素を直接キャプチャする代替手段
 */
async function captureChartCanvas(): Promise<HTMLCanvasElement | null> {
  try {
    // DOMからチャート要素を直接取得するヘルパー関数を使用
    const getChartElement = (window as any).__getChartElement;
    if (typeof getChartElement === 'function') {
      const chartElement = getChartElement();
      if (chartElement) {
        // canvas要素を見つける
        const canvas = chartElement.querySelector('canvas');
        if (canvas) {
          logger.debug('Found chart canvas element directly');
          // 新しいキャンバスにコピーして返す
          const newCanvas = document.createElement('canvas');
          newCanvas.width = canvas.width;
          newCanvas.height = canvas.height;
          const ctx = newCanvas.getContext('2d');
          ctx?.drawImage(canvas, 0, 0);
          return newCanvas;
        }
      }
    }
    return null;
  } catch (e) {
    logger.error('Error capturing chart canvas directly:', e);
    return null;
  }
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
    
    // チャートインスタンスの取得を試みる
    const chartInstance = (window as any).__chartInstance as IChartApi | null;
    
    // チャートインスタンスのデバッグ情報
    if (chartInstance) {
      logger.debug('Chart instance found:', !!chartInstance);
    } else {
      logger.warn('Chart instance not found, cannot use native screenshot');
    }
    
    // 方法1: Lightweight Charts のネイティブスクリーンショット機能を使用
    if (chartInstance) {
      logger.debug('Using Lightweight Charts native screenshot API');
      
      try {
        // レンダリングの完了を保証するために少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // takeScreenshotメソッドが存在するか確認
        if (typeof chartInstance.takeScreenshot === 'function') {
          // チャートスクリーンショットをPNG画像としてエクスポート
          const canvas = await chartInstance.takeScreenshot();
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
      const canvas = await captureChartCanvas();
      if (canvas) {
        logger.debug('Chart canvas captured directly');
        return canvas.toDataURL('image/png', 1.0);
      }
    } catch (error) {
      logger.error('Direct canvas capture failed:', error);
    }
    
    // 方法3: html2canvas方式
    logger.debug('Falling back to html2canvas method');
    const el = document.getElementById('chart-panel');
    if (!el) {
      logger.error('Chart panel element not found');
      return null;
    }

    // レンダリング完了のために短い遅延を入れる
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const canvas = await html2canvas(el as HTMLElement, {
      allowTaint: true,
      useCORS: true,
      scale: 2, // 高解像度
      logging: true,
      foreignObjectRendering: false,
      ignoreElements: (element: Element) => {
        // チャート以外の要素を無視（ツールバーやサイドバーなど）
        return element.classList.contains('ignore-screenshot');
      },
      onclone: (documentClone: Document) => {
        logger.debug('Capturing chart via html2canvas...');
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

