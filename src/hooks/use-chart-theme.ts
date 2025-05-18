import { useTheme } from 'next-themes'
import { useMemo } from 'react'

export interface ChartTheme {
  background: string
  text: string
  grid: string
  crosshair: string
  upColor: string
  downColor: string
  volume: string
}

/**
 * チャートのテーマカラーを返すフック
 * @returns テーマに応じたカラー設定
 */
export function useChartTheme(): ChartTheme {
  const { theme = 'light' } = useTheme()
  return useMemo(() => {
    const isDark = theme === 'dark'
    return {
      background: isDark ? '#1e1e1e' : '#ffffff',
      text: isDark ? '#d1d5db' : '#111827',
      grid: isDark ? '#2f3338' : '#e0e0e0',
      crosshair: isDark ? '#d1d5db' : '#111827',
      upColor: '#26a69a',
      downColor: '#ef5350',
      volume: '#4b5563'
    }
  }, [theme])
}

export default useChartTheme
