import { render } from '@testing-library/react'
import RsiPanel from '@/components/chart/RsiPanel'
import MacdPanel from '@/components/chart/MacdPanel'

const createFn = jest.fn(() => ({ chart: {}, series: {}, cleanup: jest.fn() }))

jest.mock('@/hooks/chart/use-indicator-chart', () => ({
  useIndicatorChart: () => createFn,
}))

jest.mock('@/components/chart/IndicatorPanel', () => {
  const factory = require('../../utils/mockIndicatorPanel').default
  return factory()
})

describe('Indicator panels line width', () => {
  it('passes width to RsiPanel chart creator', () => {
    render(<RsiPanel data={[]} chart={null} height={100} lineWidth={5} />)
    expect(createFn).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({ lineWidth: 5 }))
  })

  it('passes width to MacdPanel chart creator', () => {
    render(
      <MacdPanel macd={[]} signal={[]} histogram={[]} chart={null} height={100} lineWidth={4} />
    )
    expect(createFn).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({ lineWidth: 4 }))
  })
})
