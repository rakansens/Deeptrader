import { renderHook } from '@testing-library/react'
import useBinanceSocket from '@/hooks/use-binance-socket'

class MockWebSocket {
  static instances: MockWebSocket[] = []
  static OPEN = 1
  readyState = MockWebSocket.OPEN
  onopen?: () => void
  onclose?: () => void
  onerror?: (e: any) => void
  onmessage?: (e: { data: string }) => void
  sent: string[] = []
  constructor(url: string) {
    MockWebSocket.instances.push(this)
  }
  send(data: string) {
    this.sent.push(data)
  }
  close() {}
}

;(global as any).WebSocket = MockWebSocket as any

describe('useBinanceSocket', () => {
  it('opens websocket and handles messages', () => {
    const onMessage = jest.fn()
    const { unmount } = renderHook(() =>
      useBinanceSocket<{ foo: string }>({ url: 'wss://test', onMessage })
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

  it('sends ping at interval', () => {
    jest.useFakeTimers()
    renderHook(() =>
      useBinanceSocket({ url: 'wss://test', pingInterval: 1000 })
    )
    const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1]
    ws.onopen?.()
    jest.advanceTimersByTime(1000)
    expect(ws.sent.length).toBeGreaterThan(0)
    const msg = JSON.parse(ws.sent[0])
    expect(msg.method).toBe('PING')
    jest.useRealTimers()
  })
})
