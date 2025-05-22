import { renderHook, act } from '@testing-library/react'
import useCandleCountdown from '@/hooks/chart/use-candle-countdown'
import type { Timeframe } from '@/constants/chart'

describe('useCandleCountdown', () => {
  it('counts down each second', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-01-01T00:00:30Z'))

    const timeframe: Timeframe = '1m'
    const { result } = renderHook(() => useCandleCountdown(timeframe))
    expect(result.current).toBe(30000)

    act(() => {
      jest.advanceTimersByTime(10000)
    })
    expect(result.current).toBe(20000)
    jest.useRealTimers()
  })

  it('updates when interval changes', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-01-01T00:00:30Z'))

    const { result, rerender } = renderHook(
      ({ interval }: { interval: Timeframe }) => useCandleCountdown(interval),
      { initialProps: { interval: '1m' as Timeframe } }
    )
    expect(result.current).toBe(30000)

    rerender({ interval: '5m' })
    act(() => {
      jest.advanceTimersByTime(0)
    })
    expect(result.current).toBe(270000)
    jest.useRealTimers()
  })
})
