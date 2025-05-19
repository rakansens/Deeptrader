'use client';

import { useCallback } from 'react';
import { logger } from '@/lib/logger';
import { createChart, IChartApi, CrosshairMode } from 'lightweight-charts';
import useChartTheme from './use-chart-theme';

interface UseIndicatorChartProps {
  height: number;
  mainChart: IChartApi | null;
}

/**
 * 指標用のサブチャートを作成するためのカスタムフック
 */
export function useIndicatorChart({ height, mainChart }: UseIndicatorChartProps) {
  const colors = useChartTheme();

  return useCallback(
    (container: HTMLDivElement) => {
      const chart = createChart(container, {
        width: container.clientWidth,
        height,
        layout: { background: { color: colors.background }, textColor: colors.text },
        grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: colors.crosshair, labelVisible: true, labelBackgroundColor: colors.background },
          horzLine: { color: colors.crosshair, labelVisible: true, labelBackgroundColor: colors.background }
        },
        rightPriceScale: {
          borderColor: colors.grid,
          borderVisible: true,
          scaleMargins: { top: 0.1, bottom: 0.05 }
        },
        timeScale: { 
          borderColor: colors.grid,
          visible: true,
          timeVisible: true,
          secondsVisible: false
        }
      });

      // イベントリスナーを格納する変数
      let listeners: Array<() => void> = [];

      // メインチャートとタイムスケールを同期（安全にサブスクリプションを管理）
      if (mainChart) {
        try {
          const mainTimeScale = mainChart.timeScale();
          const thisTimeScale = chart.timeScale();
          
          // 初期化時にメインチャートの表示範囲を取得して設定
          const initialRange = mainTimeScale.getVisibleLogicalRange();
          if (initialRange) {
            thisTimeScale.setVisibleLogicalRange(initialRange);
          }
          
          // サブスクライブして、必要に応じてイベントリスナーを取り外す処理を追加
          try {
            // イベントハンドラを指定してサブスクライブ
            mainTimeScale.subscribeVisibleLogicalRangeChange(() => {
              try {
                const logicalRange = mainTimeScale.getVisibleLogicalRange();
                if (logicalRange && thisTimeScale) {
                  thisTimeScale.setVisibleLogicalRange(logicalRange);
                }
              } catch (e) {
                // エラーを無視（すでに破棄されたオブジェクトへのアクセスを防ぐ）
                logger.warn('チャート同期エラー:', e);
              }
            });
            
            // クリーンアップ時にタイムスケールの同期を解除する関数を追加
            listeners.push(() => {
              try {
                // lightweight-chartsのAPIではサブスクライブ解除は自動的に行われる
                // チャートの削除時に全てのリスナーは解除される
              } catch (e) {
                logger.warn('サブスクリプション解除エラー:', e);
              }
            });
          } catch (e) {
            logger.warn('サブスクリプションエラー:', e);
          }
        } catch (e) {
          logger.warn('チャート同期初期化エラー:', e);
        }
      }

      const handleResize = () => {
        try {
          chart.resize(container.clientWidth, height);
        } catch (e) {
          // リサイズエラーを無視（すでに破棄されたチャートへのアクセスを防ぐ）
          logger.warn('チャートリサイズエラー:', e);
        }
      };

      // リサイズイベントリスナーを追加
      window.addEventListener('resize', handleResize);
      listeners.push(() => window.removeEventListener('resize', handleResize));

      return {
        chart,
        cleanup: () => {
          // 全てのイベントリスナーをクリーンアップ
          listeners.forEach(removeListener => {
            try {
              removeListener();
            } catch (e) {
              logger.warn('リスナー解除エラー:', e);
            }
          });
          
          try {
            chart.remove();
          } catch (e) {
            logger.warn('チャート破棄エラー:', e);
          }
        }
      };
    },
    [height, colors, mainChart]
  );
}

/**
 * チャートデータとオプションを管理するためのカスタムフック
 */
export function useChart() {
  const colors = useChartTheme();
  
  // 基本的なチャート機能を提供するオブジェクトを返す
  return {
    colors,
    // 必要に応じて拡張可能
  };
} 