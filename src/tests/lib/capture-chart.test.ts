import type { IChartApi } from 'lightweight-charts'

jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(document.createElement('canvas')))
}))

import { captureChart } from '@/lib/capture-chart'

const mockedHtml2canvas = require('html2canvas').default as jest.Mock

describe('captureChart', () => {
  afterEach(() => {
    jest.clearAllMocks()
    delete (window as any).__chartInstance
    delete (window as any).__getChartElement
    document.body.innerHTML = ''
  })

  it('skips takeScreenshot when element missing', async () => {
    const takeScreenshot = jest.fn()
    ;(window as any).__chartInstance = { takeScreenshot } as unknown as IChartApi
    ;(window as any).__getChartElement = jest.fn(() => document.createElement('div'))
    document.body.innerHTML = '<div id="chart-panel"></div>'

    await captureChart()

    expect(takeScreenshot).not.toHaveBeenCalled()
    expect(mockedHtml2canvas).toHaveBeenCalled()
  })
})
