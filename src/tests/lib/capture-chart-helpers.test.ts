import type { IChartApi } from 'lightweight-charts'
import { getChartCardElement, captureViaHtml2Canvas, captureViaNativeApi } from '@/lib/capture-chart'

interface WindowWithChart extends Window {
  __getChartElement?: () => HTMLElement
  __chartInstance?: IChartApi
}

jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn(() =>
    Promise.resolve({
      toDataURL: jest.fn(() => 'data:image/png;base64,x')
    })
  )
}))

const mockedHtml2canvas = require('html2canvas').default as jest.Mock

describe('capture-chart helpers', () => {
  afterEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = ''
    const w = window as WindowWithChart
    delete w.__getChartElement
  })

  describe('getChartCardElement', () => {
    it('returns card element when structure exists', () => {
      document.body.innerHTML = `
        <div class="rounded-lg border">
          <div><div><div id="chart-panel"></div></div></div>
        </div>`
      const card = getChartCardElement()
      const expected = document.querySelector('.rounded-lg') as HTMLElement
      expect(card).toBe(expected)
    })

    it('returns null when chart panel missing', () => {
      expect(getChartCardElement()).toBeNull()
    })
  })

  describe('captureViaHtml2Canvas', () => {
    it('calls html2canvas with element', async () => {
      const el = document.createElement('div')
      const url = await captureViaHtml2Canvas(el)
      expect(url).toBe('data:image/png;base64,x')
      expect(mockedHtml2canvas).toHaveBeenCalledWith(el, expect.any(Object))
    })
  })

  describe('captureViaNativeApi', () => {
    it('uses takeScreenshot when available', async () => {
      const canvas = document.createElement('canvas')
      ;(canvas as any).toDataURL = () => 'data:image/png;base64,x'
      const takeScreenshot = jest.fn(() => Promise.resolve(canvas))
      const chart = { takeScreenshot } as unknown as IChartApi
      const element = document.createElement('div')
      const w = window as WindowWithChart
      w.__getChartElement = jest.fn(() => element)
      document.body.appendChild(element)
      const url = await captureViaNativeApi(chart)
      expect(takeScreenshot).toHaveBeenCalled()
      expect(url).toBe('data:image/png;base64,x')
    })

    it('returns null when chart is undefined', async () => {
      const url = await captureViaNativeApi(undefined)
      expect(url).toBeNull()
    })
  })
})
