// src/components/chart/IndicatorPanel.tsx
// 新規作成: インジケーターパネルコンポーネント
'use client'

import { useRef, useEffect } from 'react'
import { X } from 'lucide-react'
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
      className={cn('w-full bg-card border border-border/40 rounded-none shadow-lg flex flex-col overflow-hidden', className)}
      style={height === "auto" ? {} : { height }}
      data-testid={`${title.toLowerCase()}-panel`}
    >
      <div className="flex items-center justify-between px-2 py-0.5 border-b border-border/40 bg-secondary">
        <span className="text-[10px] font-medium">{title}</span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="text-muted-foreground p-0.5 rounded-none"
            type="button"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div 
        ref={containerRef} 
        className="flex-1 overflow-hidden"
      >
        {children}
      </div>
    </div>
  )
}
