import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import type { ChartTheme } from '@/types'

/**
 * チャートのテーマカラーを返すフック
 * TradingView風のスタイルに最適化
 * @returns テーマに応じたカラー設定
 */
export function useChartTheme(): ChartTheme {
  const { theme = 'dark' } = useTheme()
  return useMemo(() => {
    const isDark = theme === 'dark'
    return {
      // TradingView風のダークモードカラー
      background: isDark ? '#131722' : '#ffffff',
      text: isDark ? '#d1d4dc' : '#131722',
      grid: isDark ? '#2a2e39' : '#f0f3fa',
      crosshair: isDark ? '#758696' : '#758696',
      upColor: '#26a69a', // 緑色（上昇）
      downColor: '#ef5350', // 赤色（下降）
      volume: isDark ? '#202a3b' : '#e1f5fe',
      // 移動平均線の色
      ma7: '#f5c105', // 黄色 (短期MA - 7)
      ma25: '#ff5000', // オレンジ色 (中期MA - 25)
      ma99: '#8e44ad'  // 紫色 (長期MA - 99)
    }
  }, [theme])
}

export default useChartTheme
