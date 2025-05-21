import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

beforeAll(() => {
  // Radix Select relies on hasPointerCapture which jsdom lacks
  // @ts-ignore
  HTMLElement.prototype.hasPointerCapture = () => false
  // Scroll APIs are also missing in jsdom
  HTMLElement.prototype.scrollIntoView = () => {}
})
import ChartToolbar from '@/components/chart/ChartToolbar'
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
        settings={{
          sma: 14,
          rsi: 14,
          rsiUpper: 70,
          rsiLower: 30,
          macd: { short: 12, long: 26, signal: 9 },
          boll: { period: 20, stdDev: 2 },
          lineWidth: { ma: 2, rsi: 2, macd: 2, boll: 1 },
        }}
        onSettingsChange={jest.fn()}
      />
    )

    const tfTrigger = screen.getByTestId('timeframe-trigger')
    fireEvent.keyDown(tfTrigger, { key: 'Enter' })
    const option = await screen.findByRole('option', {
      name: `Timeframe ${TIMEFRAMES[1]}`,
    })
    await user.click(option)
    expect(onTf).toHaveBeenCalledWith(TIMEFRAMES[1])

    await user.click(
      screen.getByRole('menuitemcheckbox', { name: /MA/ })
    )
    expect(onInd).toHaveBeenLastCalledWith({ ma: true, rsi: false, macd: false, boll: false })
  })

  it('calls onSettingsChange when width changed', async () => {
    const user = userEvent.setup()
    const onSettings = jest.fn()
    render(
      <ChartToolbar
        timeframe="1m"
        onTimeframeChange={() => {}}
        indicators={{ ma: false, rsi: false, macd: false, boll: false }}
        onIndicatorsChange={() => {}}
        settings={{
          sma: 14,
          rsi: 14,
          rsiUpper: 70,
          rsiLower: 30,
          macd: { short: 12, long: 26, signal: 9 },
          boll: { period: 20, stdDev: 2 },
          lineWidth: { ma: 2, rsi: 2, macd: 2, boll: 1 },
        }}
        onSettingsChange={onSettings}
      />
    )

    fireEvent.click(screen.getByLabelText('Indicator settings'))
    fireEvent.change(screen.getByLabelText('MA Width'), { target: { value: 3 } })
    expect(onSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({ lineWidth: expect.objectContaining({ ma: 3 }) })
    )
  })

  it('applies responsive classes', () => {
    render(
      <ChartToolbar
        timeframe="1m"
        onTimeframeChange={() => {}}
        indicators={{ ma: false, rsi: false, macd: false, boll: false }}
        onIndicatorsChange={() => {}}
        settings={{
          sma: 14,
          rsi: 14,
          rsiUpper: 70,
          rsiLower: 30,
          macd: { short: 12, long: 26, signal: 9 },
          boll: { period: 20, stdDev: 2 },
          lineWidth: { ma: 2, rsi: 2, macd: 2, boll: 1 },
        }}
        onSettingsChange={() => {}}
      />
    )

    const toolbar = screen.getByTestId('chart-toolbar')
    expect(toolbar.className).toContain('flex-col')
    const tfTrigger = screen.getByTestId('timeframe-trigger')
    const tfGroup = tfTrigger.parentElement as HTMLElement
    expect(tfGroup.className).toContain('flex-wrap')
  })
})
