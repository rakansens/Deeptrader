// src/components/chart/IndicatorPanel.tsx
// 新規作成: インジケーターパネルコンポーネント
'use client'

import { useRef, useEffect } from 'react'
import { X, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IndicatorPanelProps {
  title: string
  height: number | "auto"
  className?: string
  onClose?: () => void
  /**
   * コンテナがマウントされた後に呼び出されるチャート初期化関数
   * 戻り値はクリーンアップ関数
   */
  initChart?: (container: HTMLDivElement) => () => void
  children?: React.ReactNode
}

export default function IndicatorPanel({
  title,
  height,
  className,
  onClose,
  initChart,
  children
}: IndicatorPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current || !initChart) return
    return initChart(containerRef.current)
  }, [initChart])

  return (
    <div
      className={cn('w-full bg-background border-t border-border flex flex-col', className)}
      style={height === "auto" ? {} : { height }}
      data-testid={`${title.toLowerCase()}-panel`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
        <span className="font-medium">{title}</span>
        <div className="flex items-center">
          <button
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="text-muted-foreground hover:text-foreground p-1"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto bg-background">{children}</div>
    </div>
  )
}
