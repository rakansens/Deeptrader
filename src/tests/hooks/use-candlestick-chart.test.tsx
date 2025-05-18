import React from 'react'
import { render } from '@testing-library/react'
import { useCandlestickChart } from '@/hooks/useCandlestickChart'

jest.mock('lightweight-charts', () => ({
  createChart: jest.fn(() => ({
    addCandlestickSeries: jest.fn(() => ({ setData: jest.fn(), update: jest.fn() })),
    addHistogramSeries: jest.fn(() => ({ setData: jest.fn(), update: jest.fn() })),
    remove: jest.fn(),
  })),
}))

describe('useCandlestickChart', () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  it('creates WebSocket connection', () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] }) as any
    const mockWs = { close: jest.fn(), onmessage: null as any }
    global.WebSocket = jest.fn(() => mockWs) as any

    function Test() {
      const { containerRef } = useCandlestickChart({
        height: 300,
        theme: 'light',
        symbol: 'BTCUSDT',
        interval: '1m',
        useApi: false,
        indicators: { ma: false, rsi: false },
      })
      return <div ref={containerRef}></div>
    }

    render(<Test />)
    expect(global.WebSocket).toHaveBeenCalled()
  })
})
