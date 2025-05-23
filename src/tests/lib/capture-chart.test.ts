import type { IChartApi } from 'lightweight-charts'

jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(document.createElement('canvas')))
}))

import { captureChart } from '@/lib/chart'

interface WindowWithChart extends Window {
  __getChartElement?: () => HTMLElement
  __chartInstance?: IChartApi
}

const mockedHtml2canvas = require('html2canvas').default as jest.Mock

describe('captureChart', () => {
  afterEach(() => {
    jest.clearAllMocks()
    const w = window as WindowWithChart
    delete w.__chartInstance
    delete w.__getChartElement
    document.body.innerHTML = ''
  })

  it('skips takeScreenshot when element missing', async () => {
    const takeScreenshot = jest.fn()
    const w = window as WindowWithChart
    w.__chartInstance = { takeScreenshot } as unknown as IChartApi
    w.__getChartElement = jest.fn(() => document.createElement('div'))
    document.body.innerHTML = '<div id="chart-panel"></div>'

    await captureChart()

    expect(takeScreenshot).not.toHaveBeenCalled()
    expect(mockedHtml2canvas).toHaveBeenCalled()
  })
})
