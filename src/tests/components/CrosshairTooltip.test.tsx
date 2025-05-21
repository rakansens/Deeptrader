import { render, screen } from '@testing-library/react'
import CrosshairTooltip from '@/components/chart/CrosshairTooltip'
import type { CrosshairInfo } from '@/types/chart'

describe('CrosshairTooltip', () => {
  it('renders OHLC and change info', () => {
    const info: CrosshairInfo = {
      time: 1620000000 as any,
      open: 100,
      high: 120,
      low: 90,
      close: 110,
      volume: 50,
      change: 10,
      changePercent: 10,
    }
    render(<CrosshairTooltip info={info} />)
    expect(screen.getByTestId('crosshair-tooltip')).toBeInTheDocument()
    expect(screen.getByText(/O:100/)).toBeInTheDocument()
    expect(screen.getByText(/H:120/)).toBeInTheDocument()
    expect(screen.getByText(/L:90/)).toBeInTheDocument()
    expect(screen.getByText(/C:110/)).toBeInTheDocument()
    expect(screen.getByText(/Δ\+10\.00 \(\+10\.00%\)/)).toBeInTheDocument()
    expect(screen.getByText(/V:50/)).toBeInTheDocument()
  })
})
