import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChartTabs from '@/components/chart/ChartTabs'
import { SYMBOLS, TIMEFRAMES, DEFAULT_INDICATOR_SETTINGS } from '@/constants/chart'

jest.mock('@/components/chart/CandlestickChart', () => (props: any) => (
  <div data-testid={`chart-${props.symbol}`}></div>
))

describe('ChartTabs', () => {
  const baseProps = {
    symbol: SYMBOLS[1].value,
    onSymbolChange: jest.fn(),
    timeframe: TIMEFRAMES[0],
    indicators: { ma: false, rsi: false, macd: false, boll: false },
    onIndicatorsChange: jest.fn(),
    settings: DEFAULT_INDICATOR_SETTINGS,
    drawingColor: '#ff0000',
    onDrawingColorChange: jest.fn(),
    onPriceInfoUpdate: jest.fn(),
    showOrderBook: false,
    onOrderBookToggle: jest.fn(),
  }

  it('adds and removes tabs', async () => {
    const user = userEvent.setup()
    render(<ChartTabs {...baseProps} />)

    expect(screen.getAllByRole('tab').length).toBe(1)
    await user.click(screen.getByLabelText('Add tab'))
    expect(screen.getAllByRole('tab').length).toBe(2)
    await user.click(screen.getAllByLabelText('Close tab')[0])
    expect(screen.getAllByRole('tab').length).toBe(1)
  })

  it('switches tabs to show corresponding chart', async () => {
    const user = userEvent.setup()
    render(<ChartTabs {...baseProps} />)

    await user.click(screen.getByLabelText('Add tab'))
    // new tab uses SYMBOLS[0]
    expect(screen.getByTestId(`chart-${SYMBOLS[0].value}`)).toBeInTheDocument()

    const firstTab = screen.getAllByRole('tab')[0]
    await user.click(firstTab)
    expect(screen.getByTestId(`chart-${SYMBOLS[1].value}`)).toBeInTheDocument()
  })
})
