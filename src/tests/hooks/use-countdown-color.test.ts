import { renderHook, act } from '@testing-library/react'
import useCountdownColor from '@/hooks/chart/use-countdown-color'
import type { CandlestickData } from 'lightweight-charts'
import type { ChartTheme } from '@/types'

describe('useCountdownColor', () => {
  const theme: ChartTheme = {
    background: '#000',
    text: '#fff',
    grid: '#333',
    crosshair: '#fff',
    upColor: '#0f0',
    downColor: '#f00',
    volume: '#00f'
  }

  it('returns up or down color based on latest candle', () => {
    const up: CandlestickData = { time: 1 as any, open: 1, high: 2, low: 0, close: 2 }
    const down: CandlestickData = { time: 2 as any, open: 2, high: 3, low: 1, close: 1 }
    const { result, rerender } = renderHook(
      ({ candles }) => useCountdownColor(candles, theme),
      { initialProps: { candles: [up] } }
    )

    expect(result.current.backgroundColor).toBe(theme.upColor)
    expect(result.current.textColor).toBe('#ffffff')

    rerender({ candles: [down] })
    expect(result.current.backgroundColor).toBe(theme.downColor)
  })

  it('returns undefined when no candles', () => {
    const { result } = renderHook(() => useCountdownColor([], theme))
    expect(result.current.backgroundColor).toBeUndefined()
    expect(result.current.textColor).toBe('#ffffff')
  })
})
