import { render } from '@testing-library/react'
import ChartPage from './page'

describe('ChartPage', () => {
  it('matches snapshot', () => {
    const { asFragment } = render(<ChartPage />)
    expect(asFragment()).toMatchSnapshot()
  })
})
