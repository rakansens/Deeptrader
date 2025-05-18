// src/components/chart/IndicatorPanel.tsx
// 新規作成: インジケーターパネルコンポーネント
'use client'

import { useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IndicatorPanelProps {
  title: string
  height: number
  className?: string
  onClose?: () => void
  /**
   * コンテナがマウントされた後に呼び出されるチャート初期化関数
   * 戻り値はクリーンアップ関数
   */
  initChart?: (container: HTMLDivElement) => () => void
}

export default function IndicatorPanel({
  title,
  height,
  className,
  onClose,
  initChart
}: IndicatorPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current || !initChart) return
    return initChart(containerRef.current)
  }, [initChart])

  return (
    <div
      className={cn('w-full bg-background border-t border-border flex flex-col', className)}
      style={{ height }}
      data-testid={`${title.toLowerCase()}-panel`}
    >
      <div className="flex items-center justify-between text-xs px-2 py-1 border-b">
        <span>{title}</span>
        <button
          onClick={onClose}
          aria-label={`Close ${title}`}
          className="text-muted-foreground hover:text-foreground"
          type="button"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  )
}
