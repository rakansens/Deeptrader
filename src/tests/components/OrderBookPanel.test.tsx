import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import OrderBookPanel from '@/components/chart/OrderBookPanel'
import useOrderBook from '@/hooks/use-order-book'

jest.mock('@/hooks/use-order-book')
const mockUseOrderBook = useOrderBook as jest.Mock

describe('OrderBookPanel', () => {
  it('renders bid and ask tables', () => {
    mockUseOrderBook.mockReturnValue({
      bids: [{ price: 1, quantity: 2 }],
      asks: [{ price: 1.1, quantity: 3 }],
      connected: true
    })
    render(<OrderBookPanel symbol="BTCUSDT" height={100} />)
    expect(screen.getByTestId('orderbook-panel')).toBeInTheDocument()
    const bidRow = screen.getAllByTestId('bid-row')[0]
    const askRow = screen.getAllByTestId('ask-row')[0]
    expect(bidRow).toHaveClass('text-green-700')
    expect(askRow).toHaveClass('text-red-700')
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('1.1')).toBeInTheDocument()
  })

  it('highlights current price row', () => {
    mockUseOrderBook.mockReturnValue({
      bids: [{ price: 1, quantity: 2 }],
      asks: [{ price: 1.1, quantity: 3 }],
      connected: true,
    })
    render(<OrderBookPanel symbol="BTCUSDT" height={100} currentPrice={1} />)
    const row = screen.getByTestId('current-price-row')
    expect(row).toBeInTheDocument()
  })
})

