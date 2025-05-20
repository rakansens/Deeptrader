"use client"

import type { Timeframe } from '@/constants/chart'
import useCandleCountdown from '@/hooks/use-candle-countdown'

interface CandleCountdownProps {
  interval: Timeframe
  className?: string
}

/**
 * ローソク足確定までの残り時間を表示する
 */
export default function CandleCountdown({ interval, className }: CandleCountdownProps) {
  const remaining = useCandleCountdown(interval)

  const format = (ms: number) => {
    const total = Math.floor(ms / 1000)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const mm = m.toString().padStart(2, '0')
    const ss = s.toString().padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
  }

  return (
    <div
      className={`px-2 py-1 text-xs rounded bg-background/80 backdrop-blur ${className ?? ''}`}
      data-testid="candle-countdown"
    >
      {format(remaining)}
    </div>
  )
}
