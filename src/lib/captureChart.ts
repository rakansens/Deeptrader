import html2canvas from 'html2canvas'
import { IChartApi } from 'lightweight-charts'
import { logger } from '@/lib/logger'

// 型定義は専用ファイルに移動済み（src/types/lightweight-charts.d.ts）

/**
 * チャート全体（時間軸・価格軸含む）の親要素を取得する
 */
async function getChartParentElement(): Promise<HTMLElement | null> {
  try {
    // チャートパネル全体を優先的に取得（最も広い範囲）
    const chartPanel = document.getElementById('chart-panel');
    if (chartPanel) {
      logger.debug('Found chart panel element (best option for full capture)');
      return chartPanel;
    }
    
    // チャートコンテナを検索
    const chartContainer = document.querySelector('[data-testid="chart-container"]')?.parentElement;
    if (chartContainer) {
      logger.debug('Found chart container parent element');
      return chartContainer as HTMLElement;
    }
    
    // DOMからチャート要素を直接取得
    const getChartElement = (window as any).__getChartElement;
    if (typeof getChartElement === 'function') {
      const chartElement = getChartElement();
      if (chartElement?.parentElement) {
        logger.debug('Found chart element parent via helper function');
        return chartElement.parentElement;
      }
    }
    
    // 最終手段：チャートらしき要素を検索
    const possibleContainers = document.querySelectorAll('.tv-lightweight-charts');
    if (possibleContainers.length > 0) {
      const container = possibleContainers[0].parentElement;
      if (container) {
        logger.debug('Found chart container via class search');
        return container as HTMLElement;
      }
    }
    
    logger.warn('No suitable chart parent element found');
    return null;
  } catch (e) {
    logger.error('Error finding chart parent element:', e);
    return null;
  }
}

/**
 * チャートパネルをキャプチャしてPNGデータURLを返す
 * 
 * 1. チャートパネル全体をhtml2canvasでキャプチャ（価格・時間軸を含む）
 * 2. 失敗した場合はLightweight Chartsのネイティブ機能にフォールバック
 * 3. それも失敗した場合はキャンバス要素の直接キャプチャを試行
 */
export async function captureChart(): Promise<string | null> {
  try {
    logger.debug('Chart screenshot requested');
    
    // チャート全体の親要素を取得（価格軸・時間軸を含む）
    const chartParent = await getChartParentElement();
    if (!chartParent) {
      logger.error('Cannot find chart parent element');
      return null;
    }
    
    // 方法1: チャート全体をhtml2canvasで直接キャプチャ（最も確実）
    logger.debug('Capturing full chart with html2canvas');
    try {
      // レンダリング完了のために少し待機
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(chartParent, {
        allowTaint: true,
        useCORS: true,
        scale: 2, // 高解像度
        logging: true, // デバッグログを有効化
        backgroundColor: null, // 透過背景
        foreignObjectRendering: false,
        ignoreElements: (element: Element) => {
          // チャート以外の要素を無視（ツールバーやサイドバーなど）
          return element.classList.contains('ignore-screenshot');
        },
        onclone: (documentClone: Document) => {
          logger.debug('Processing cloned DOM for screenshot');
          
          // 複製されたDOM内でチャート親要素を検索
          const panelClone = documentClone.getElementById(chartParent.id);
          if (panelClone) {
            // スタイル調整（非表示要素が見えるようにする）
            const priceScales = panelClone.querySelectorAll('.price-scale');
            priceScales.forEach(scale => {
              (scale as HTMLElement).style.visibility = 'visible';
              (scale as HTMLElement).style.display = 'block';
            });
            
            // 時間軸の表示調整
            const timeScales = panelClone.querySelectorAll('.time-scale');
            timeScales.forEach(scale => {
              (scale as HTMLElement).style.visibility = 'visible';
              (scale as HTMLElement).style.display = 'block';
            });
            
            // Canvas要素の確認
            const canvases = panelClone.querySelectorAll('canvas');
            logger.debug(`Found ${canvases.length} canvas elements in cloned DOM`);
          }
          
          return documentClone;
        }
      });
      
      logger.debug('Full chart capture successful');
      return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      logger.error('Full chart capture failed:', error);
    }
    
    // 方法2: Lightweight Charts APIを使用
    const chartInstance = (window as any).__chartInstance as IChartApi | null;
    if (chartInstance && typeof chartInstance.takeScreenshot === 'function') {
      logger.debug('Falling back to Lightweight Charts native API');
      try {
        const canvas = await chartInstance.takeScreenshot();
        logger.debug('Chart screenshot successful via native API');
        return canvas.toDataURL('image/png', 1.0);
      } catch (error) {
        logger.error('Native chart screenshot failed:', error);
      }
    }
    
    // 方法3: 最終手段 - チャートを含む要素全体を取得して再試行
    logger.debug('Final attempt: capturing with modified html2canvas settings');
    const fullPage = document.querySelector('[data-testid="chart-container"]')?.closest('.relative');
    if (fullPage) {
      const canvas = await html2canvas(fullPage as HTMLElement, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        logging: true,
        backgroundColor: null,
        ignoreElements: (element: Element) => {
          // チャート以外の要素を除外
          return element.classList.contains('ignore-screenshot');
        }
      });
      
      logger.debug('Chart capture successful via fallback method');
      return canvas.toDataURL('image/png', 1.0);
    }
    
    logger.error('All chart capture methods failed');
    return null;
  } catch (error) {
    logger.error('Screenshot capture failed:', error);
    return null;
  }
}

