import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import type { ChartTheme } from '@/types'

/**
 * チャートのテーマカラーを返すフック
 * Hyperliquid風のスタイルに最適化
 * @returns テーマに応じたカラー設定
 */
export function useChartTheme(): ChartTheme {
  const { theme = 'dark' } = useTheme()
  return useMemo(() => {
    const isDark = theme === 'dark'
    return {
      // Hyperliquid風のダークモードカラー
      background: isDark ? '#050f13' : '#ffffff', // 更に暗い青黒背景
      text: isDark ? '#C8D6E5' : '#131722',
      grid: isDark ? '#0e1a24' : '#f0f3fa', // より暗いグリッド
      crosshair: isDark ? '#8fa0aa' : '#758696',
      upColor: '#0ddfba', // より鮮やかなティール系（上昇）
      downColor: '#ff4d4d', // より鮮やかなサーモン系（下降）
      volume: isDark ? '#0ddfba' : '#e1f5fe', // 出来高も同じティール
      volumeBackground: isDark ? '#030a0f' : '#f5f8fa', // 出来高の背景（メインチャートより暗め）
      // 移動平均線の色
      ma7: '#ffcc33', // 黄色 (短期MA - 7)
      ma25: '#ff4d8c', // ピンク (中期MA - 25)
      ma99: '#5db3ff'  // 青 (長期MA - 99)
    }
  }, [theme])
}

export default useChartTheme
