import { renderHook } from '@testing-library/react'
import useBinanceSocket from '@/hooks/use-binance-socket'

class MockWebSocket {
  static instances: MockWebSocket[] = []
  onopen?: () => void
  onclose?: () => void
  onerror?: (e: any) => void
  onmessage?: (e: { data: string }) => void
  constructor(url: string) {
    MockWebSocket.instances.push(this)
  }
  close() {}
}

;(global as any).WebSocket = MockWebSocket as any

describe('useBinanceSocket', () => {
  it('opens websocket and handles messages', () => {
    const onMessage = jest.fn()
    const { unmount } = renderHook(() =>
      useBinanceSocket({ url: 'wss://test', onMessage })
    )
    const ws = MockWebSocket.instances[0]
    ws.onopen?.()
    ws.onmessage?.({ data: JSON.stringify({ foo: 'bar' }) })
    expect(onMessage).toHaveBeenCalledWith({ foo: 'bar' })
    unmount()
  })

  it('reconnects on close', () => {
    jest.useFakeTimers()
    renderHook(() => useBinanceSocket({ url: 'wss://test' }))
    const ws1 = MockWebSocket.instances[0]
    ws1.onclose?.()
    jest.advanceTimersByTime(3000)
    expect(MockWebSocket.instances.length).toBe(2)
    jest.useRealTimers()
  })
})
