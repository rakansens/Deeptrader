import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChartToolbar from './ChartToolbar'

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

    await user.click(screen.getByRole('button', { name: '5m' }))
    expect(onTf).toHaveBeenCalledWith('5m')

    await user.click(screen.getByLabelText('MA'))
    expect(onInd).toHaveBeenLastCalledWith({ ma: true, rsi: false, macd: false, boll: false })
  })
})
