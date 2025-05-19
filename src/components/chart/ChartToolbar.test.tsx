import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChartToolbar from './ChartToolbar'
import { TIMEFRAMES } from '@/constants/chart'

describe('ChartToolbar', () => {
  it('handles interactions', async () => {
    const user = userEvent.setup()
    const onTf = jest.fn()
    const onInd = jest.fn()
    render(
      <ChartToolbar
        timeframe="1m"
        onTimeframeChange={onTf}
        indicators={{ ma: false, rsi: false, macd: false, boll: false }}
        onIndicatorsChange={onInd}
      />
    )

    await user.click(
      screen.getByRole('radio', { name: `Timeframe ${TIMEFRAMES[1]}` })
    )
    expect(onTf).toHaveBeenCalledWith(TIMEFRAMES[1])

    await user.click(screen.getByLabelText('MA'))
    expect(onInd).toHaveBeenLastCalledWith({ ma: true, rsi: false, macd: false, boll: false })
  })

  it('renders controls in a single row', () => {
    render(
      <ChartToolbar
        timeframe="1m"
        onTimeframeChange={() => {}}
        indicators={{ ma: false, rsi: false, macd: false, boll: false }}
        onIndicatorsChange={() => {}}
      />
    )

    const toolbar = screen.getByTestId('chart-toolbar')
    expect(toolbar.className).toContain('flex-col')
    expect(toolbar.className).not.toContain('flex-wrap')
  })
})
