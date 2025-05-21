import { renderHook, act } from '@testing-library/react'
import useCandleCountdown from '@/hooks/chart/use-candle-countdown'

describe('useCandleCountdown', () => {
  it('counts down each second', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-01-01T00:00:30Z'))

    const { result } = renderHook(() => useCandleCountdown('1m' as any))
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
      ({ interval }) => useCandleCountdown(interval as any),
      { initialProps: { interval: '1m' } }
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
