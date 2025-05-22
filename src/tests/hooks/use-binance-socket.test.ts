import { renderHook, act } from '@testing-library/react'
import useBinanceSocket from '@/hooks/chart/use-binance-socket'
import { hubSdk } from '@/lib/hub-sdk'

jest.mock('@/lib/hub-sdk')
const mockSubscribe = hubSdk.subscribe as jest.Mock

class MockWS {
  readyState = 0
  private listeners: Record<string, Function[]> = {}
  addEventListener(event: string, cb: () => void) {
    this.listeners[event] = this.listeners[event] || []
    this.listeners[event].push(cb)
  }
  removeEventListener(event: string, cb: () => void) {
    this.listeners[event] = (this.listeners[event] || []).filter((f) => f !== cb)
  }
  trigger(event: string) {
    for (const cb of this.listeners[event] || []) cb()
  }
}

describe('useBinanceSocket', () => {
  beforeEach(() => {
    const ws = new MockWS()
    mockSubscribe.mockReturnValue({ ws, unsubscribe: jest.fn() })
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('subscribes and handles messages', () => {
    const onMessage = jest.fn()
    const { unmount, result } = renderHook(() =>
      useBinanceSocket<{ foo: string }>({ url: 'wss://test', onMessage })
    )
    const ws: MockWS = mockSubscribe.mock.results[0].value.ws
    act(() => ws.trigger('open'))
    expect(result.current.status).toBe('connected')
    act(() => mockSubscribe.mock.calls[0][1]({ foo: 'bar' }))
    expect(onMessage).toHaveBeenCalledWith({ foo: 'bar' })
    unmount()
    expect(mockSubscribe.mock.results[0].value.unsubscribe).toHaveBeenCalled()
  })
})

