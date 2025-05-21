"use client"

import { cn } from '@/lib/utils'
import type { CrosshairInfo } from '@/hooks/use-crosshair-info'

interface CrosshairTooltipProps {
  info: CrosshairInfo | null
  className?: string
}

/**
 * クロスヘア位置のOHLC情報を表示するツールチップ
 */
export default function CrosshairTooltip({ info, className }: CrosshairTooltipProps) {
  if (!info) return null

  const date = new Date(info.time * 1000).toLocaleString()
  const sign = info.change >= 0 ? '+' : ''

  return (
    <div
      className={cn(
        'absolute top-2 left-2 z-20 text-xs bg-background/80 border border-border rounded px-2 py-1 space-y-0.5',
        className,
      )}
      data-testid="crosshair-tooltip"
    >
      <div>{date}</div>
      <div>
        O:{info.open} H:{info.high} L:{info.low} C:{info.close}
      </div>
      <div>
        Δ{sign}
        {info.change.toFixed(2)} ({sign}
        {info.changePercent.toFixed(2)}%)
      </div>
      {info.volume !== undefined && <div>V:{info.volume}</div>}
    </div>
  )
}
