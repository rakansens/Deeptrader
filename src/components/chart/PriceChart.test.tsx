import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { act } from 'react-dom/test-utils'
import PriceChart from './PriceChart'

const lineSeriesMocks: Array<{ update: jest.Mock }> = []

const mockChart = {
  addLineSeries: jest.fn(() => {
    const obj = { update: jest.fn(), setData: jest.fn() }
    lineSeriesMocks.push(obj)
    return obj
  }),
  applyOptions: jest.fn(),
  resize: jest.fn(),
  remove: jest.fn(),
  isReady: () => true,
}

jest.mock('@/hooks/use-chart', () => ({
  useChart: () => mockChart,
}))

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

describe('PriceChart', () => {
  it.skip('renders MACD line on websocket data', async () => {
    render(<PriceChart />)
    await act(async () => {})
    const ws = MockWebSocket.instances[0]
    act(() => {
      ws.onopen?.()
    })
    act(() => {
      for (let i = 0; i < 40; i++) {
        ws.onmessage?.({ data: JSON.stringify({ p: `${100 + i}`, T: i * 1000 }) })
      }
    })
    // 4つのラインシリーズが作成され、最後がMACD
    expect(lineSeriesMocks.length).toBeGreaterThanOrEqual(4)
    expect(lineSeriesMocks[3].update).toHaveBeenCalled()
    expect(screen.getByText('MACD')).toBeInTheDocument()
  })
})
