import React from "react"
import { render } from '@testing-library/react'
import ChartPage from './page'

jest.mock('next/dynamic', () => (importFn: () => Promise<any>) => {
  const Component = () => null
  return Component
})

jest.mock('@/components/chart/CandlestickChart', () => () => <div>Chart</div>)

describe('ChartPage', () => {
  it('matches snapshot', () => {
    const { asFragment } = render(<ChartPage />)
    expect(asFragment()).toMatchSnapshot()
  })
})
