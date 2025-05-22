import { useMemo } from 'react'
import type { ChartTheme } from '@/types'

/**
 * チャートのテーマカラーを返すフック
 * Hyperliquid風のスタイルに最適化
 * 常にダークモードのカラーを返すように変更
 * @returns テーマに応じたカラー設定
 */
export function useChartTheme(): ChartTheme {
  return useMemo(() => {
    // 常にダークテーマを使用
    const isDark = true
    return {
      // Hyperliquid風のダークモードカラー
      background: '#050f13', // 更に暗い青黒背景
      text: '#C8D6E5',
      grid: '#0e1a24', // より暗いグリッド
      crosshair: '#8fa0aa',
      upColor: '#0ddfba', // より鮮やかなティール系（上昇）
      downColor: '#ff4d4d', // より鮮やかなサーモン系（下降）
      volume: '#0ddfba', // 出来高も同じティール
      volumeBackground: '#030a0f', // 出来高の背景（メインチャートより暗め）
      // 移動平均線の色
      ma7: '#ffcc33', // 黄色 (短期MA - 7)
      ma25: '#ff4d8c', // ピンク (中期MA - 25)
      ma99: '#5db3ff'  // 青 (長期MA - 99)
    }
  }, [])
}

export default useChartTheme
