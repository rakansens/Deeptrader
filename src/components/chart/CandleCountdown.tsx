"use client"

import type { Timeframe } from '@/constants/chart'
import useCandleCountdown from '@/hooks/chart/use-candle-countdown'

interface CandleCountdownProps {
  interval: Timeframe
  className?: string
  style?: React.CSSProperties // 位置や色を外部から制御
  backgroundColor?: string    // ローソク足に連動した背景色
  textColor?: string          // 背景色に合わせたテキスト色
}

/**
 * ローソク足確定までの残り時間を表示する
 */
export default function CandleCountdown({
  interval,
  className,
  style,
  backgroundColor,
  textColor,
}: CandleCountdownProps) {
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

  const defaultStyle: React.CSSProperties = {
    position: 'absolute', // CandlestickChart側で相対位置の親要素が必要
    padding: '2px 6px',   // 少し小さめのパディング
    fontSize: '10px',     // TradingView風に小さく
    borderRadius: '4px',  // 角丸
    zIndex: 10,           // 他の要素より手前に
    // backgroundColor と color は props から動的に設定
    // pointerEvents: 'none', // クリックイベントを背面に透過させる場合
  };

  return (
    <div
      style={{
        ...defaultStyle,
        backgroundColor: backgroundColor || 'rgba(128, 128, 128, 0.7)', // デフォルトはグレー半透明
        color: textColor || '#ffffff', // デフォルトは白文字
        ...style, // 外部からの top, right などで上書き
      }}
      className={className} // 追加のカスタムクラスも許容
      data-testid="candle-countdown"
    >
      {format(remaining)}
    </div>
  )
}
