import { render, screen, waitFor } from '@testing-library/react'
import CandlestickChart from '@/components/CandlestickChart'

jest.mock('lightweight-charts', () => ({
  createChart: () => ({
    addCandlestickSeries: jest.fn(() => ({ setData: jest.fn(), update: jest.fn() })),
    addHistogramSeries: jest.fn(() => ({ setData: jest.fn(), update: jest.fn() })),
    applyOptions: jest.fn(),
    resize: jest.fn(),
    remove: jest.fn(),
  }),
}))

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => [],
}) as jest.Mock

describe('CandlestickChart', () => {
  it('レンダリングされること', () => {
    render(<CandlestickChart />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('データ取得を実行すること', async () => {
    render(<CandlestickChart />)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})
