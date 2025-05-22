import { useEffect, useState } from 'react'
import type { CandlestickData } from 'lightweight-charts'
import type { ChartTheme } from '@/types'

/**
 * ローソク足の終値に応じたカウントダウン背景色を返すフック
 * @param candles - ローソク足データ
 * @param themeColors - チャートテーマカラー
 */
export function useCountdownColor(
  candles: CandlestickData[],
  themeColors?: ChartTheme
) {
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>()
  const [textColor] = useState<string>('#000000')

  useEffect(() => {
    if (!themeColors || candles.length === 0) return
    const latest = candles[candles.length - 1]
    const newColor =
      latest.close >= latest.open ? themeColors.upColor : themeColors.downColor
    setBackgroundColor(prev => (prev !== newColor ? newColor : prev))
  }, [candles, themeColors])

  return { backgroundColor, textColor }
}

export default useCountdownColor
