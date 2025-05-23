import { renderHook } from '@testing-library/react'
import { useCandlestickSeries } from '@/hooks/chart/use-candlestick-series'
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  UTCTimestamp
} from 'lightweight-charts'
import { processTimeSeriesData } from '@/lib/chart'

jest.mock('@/lib/chart', () => ({
  processTimeSeriesData: jest.fn((d) => d),
  toNumericTime: jest.fn((t) => t)
}))

describe('useCandlestickSeries', () => {
  it('adds series and sets data', () => {
    const candleSeries: Partial<ISeriesApi<'Candlestick'>> = { setData: jest.fn(), update: jest.fn(), applyOptions: jest.fn() }
    const histSeries: Partial<ISeriesApi<'Histogram'>> = { setData: jest.fn(), update: jest.fn(), applyOptions: jest.fn() }
    const priceScale = { applyOptions: jest.fn() }
    const chart = {
      addCandlestickSeries: jest.fn(() => candleSeries as ISeriesApi<'Candlestick'>),
      addHistogramSeries: jest.fn(() => histSeries as ISeriesApi<'Histogram'>),
      priceScale: jest.fn(() => priceScale),
      removeSeries: jest.fn()
    } as unknown as IChartApi

    const candleRef = { current: null } as React.MutableRefObject<ISeriesApi<'Candlestick'> | null>
    const volumeRef = { current: null } as React.MutableRefObject<ISeriesApi<'Histogram'> | null>

    const candles: CandlestickData<UTCTimestamp>[] = [
      { time: 1 as UTCTimestamp, open: 1, high: 2, low: 0, close: 1 }
    ]
    const volumes: HistogramData<UTCTimestamp>[] = [
      { time: 1 as UTCTimestamp, value: 100 }
    ]

    renderHook(() =>
      useCandlestickSeries({
        chart,
        candleRef,
        volumeRef,
        candles,
        volumes,
        colors: { upColor: '#0f0', downColor: '#f00', volume: '#00f' }
      })
    )

    expect(chart.addCandlestickSeries).toHaveBeenCalled()
    expect(chart.addHistogramSeries).toHaveBeenCalled()
    expect(candleSeries.setData).toHaveBeenCalled()
    expect(histSeries.setData).toHaveBeenCalled()
  })

  it('cleans up series on unmount', () => {
    const candleSeries: Partial<ISeriesApi<'Candlestick'>> = { setData: jest.fn(), update: jest.fn(), applyOptions: jest.fn() }
    const histSeries: Partial<ISeriesApi<'Histogram'>> = { setData: jest.fn(), update: jest.fn(), applyOptions: jest.fn() }
    const priceScale = { applyOptions: jest.fn() }
    const chart = {
      addCandlestickSeries: jest.fn(() => candleSeries as ISeriesApi<'Candlestick'>),
      addHistogramSeries: jest.fn(() => histSeries as ISeriesApi<'Histogram'>),
      priceScale: jest.fn(() => priceScale),
      removeSeries: jest.fn()
    } as unknown as IChartApi

    const candleRef = { current: null } as React.MutableRefObject<ISeriesApi<'Candlestick'> | null>
    const volumeRef = { current: null } as React.MutableRefObject<ISeriesApi<'Histogram'> | null>

    const { unmount } = renderHook(() =>
      useCandlestickSeries({
        chart,
        candleRef,
        volumeRef,
        candles: [],
        volumes: [],
        colors: { upColor: '#0f0', downColor: '#f00', volume: '#00f' }
      })
    )

    unmount()
    expect(chart.removeSeries).toHaveBeenCalledTimes(2)
    expect(candleRef.current).toBeNull()
    expect(volumeRef.current).toBeNull()
  })

  it('updates series when length is unchanged', () => {
    const candleSeries: Partial<ISeriesApi<'Candlestick'>> = {
      setData: jest.fn(),
      update: jest.fn(),
      applyOptions: jest.fn()
    }
    const histSeries: Partial<ISeriesApi<'Histogram'>> = {
      setData: jest.fn(),
      update: jest.fn(),
      applyOptions: jest.fn()
    }
    const priceScale = { applyOptions: jest.fn() }
    const chart = {
      addCandlestickSeries: jest.fn(() => candleSeries as ISeriesApi<'Candlestick'>),
      addHistogramSeries: jest.fn(() => histSeries as ISeriesApi<'Histogram'>),
      priceScale: jest.fn(() => priceScale),
      removeSeries: jest.fn()
    } as unknown as IChartApi

    const candleRef = { current: null } as React.MutableRefObject<ISeriesApi<'Candlestick'> | null>
    const volumeRef = { current: null } as React.MutableRefObject<ISeriesApi<'Histogram'> | null>

    const candles1: CandlestickData<UTCTimestamp>[] = [
      { time: 1 as UTCTimestamp, open: 1, high: 2, low: 0, close: 1 }
    ]
    const volumes1: HistogramData<UTCTimestamp>[] = [
      { time: 1 as UTCTimestamp, value: 100 }
    ]

    const { rerender } = renderHook(
      ({ candles, volumes }) =>
        useCandlestickSeries({
          chart,
          candleRef,
          volumeRef,
          candles,
          volumes,
          colors: { upColor: '#0f0', downColor: '#f00', volume: '#00f' }
        }),
      { initialProps: { candles: candles1, volumes: volumes1 } }
    )

    const candles2: CandlestickData<UTCTimestamp>[] = [
      { time: 1 as UTCTimestamp, open: 2, high: 3, low: 1, close: 2 }
    ]
    const volumes2: HistogramData<UTCTimestamp>[] = [
      { time: 1 as UTCTimestamp, value: 200 }
    ]

    rerender({ candles: candles2, volumes: volumes2 })

    expect(candleSeries.update).toHaveBeenCalledWith(candles2[0])
    expect(histSeries.update).toHaveBeenCalledWith(volumes2[0])
    expect(candleSeries.setData).toHaveBeenCalledTimes(1)
    expect(histSeries.setData).toHaveBeenCalledTimes(1)
  })

  it('sets data when new candle is added', () => {
    const candleSeries: Partial<ISeriesApi<'Candlestick'>> = {
      setData: jest.fn(),
      update: jest.fn(),
      applyOptions: jest.fn()
    }
    const histSeries: Partial<ISeriesApi<'Histogram'>> = {
      setData: jest.fn(),
      update: jest.fn(),
      applyOptions: jest.fn()
    }
    const priceScale = { applyOptions: jest.fn() }
    const chart = {
      addCandlestickSeries: jest.fn(() => candleSeries as ISeriesApi<'Candlestick'>),
      addHistogramSeries: jest.fn(() => histSeries as ISeriesApi<'Histogram'>),
      priceScale: jest.fn(() => priceScale),
      removeSeries: jest.fn()
    } as unknown as IChartApi

    const candleRef = { current: null } as React.MutableRefObject<ISeriesApi<'Candlestick'> | null>
    const volumeRef = { current: null } as React.MutableRefObject<ISeriesApi<'Histogram'> | null>

    const candles1: CandlestickData<UTCTimestamp>[] = [
      { time: 1 as UTCTimestamp, open: 1, high: 2, low: 0, close: 1 }
    ]
    const volumes1: HistogramData<UTCTimestamp>[] = [
      { time: 1 as UTCTimestamp, value: 100 }
    ]

    const { rerender } = renderHook(
      ({ candles, volumes }) =>
        useCandlestickSeries({
          chart,
          candleRef,
          volumeRef,
          candles,
          volumes,
          colors: { upColor: '#0f0', downColor: '#f00', volume: '#00f' }
        }),
      { initialProps: { candles: candles1, volumes: volumes1 } }
    )

    const candles2: CandlestickData<UTCTimestamp>[] = [
      ...candles1,
      { time: 2 as UTCTimestamp, open: 2, high: 3, low: 1, close: 2 }
    ]
    const volumes2: HistogramData<UTCTimestamp>[] = [
      ...volumes1,
      { time: 2 as UTCTimestamp, value: 200 }
    ]

    rerender({ candles: candles2, volumes: volumes2 })

    expect(candleSeries.setData).toHaveBeenCalledTimes(2)
    expect(histSeries.setData).toHaveBeenCalledTimes(2)
    expect(candleSeries.update).not.toHaveBeenCalled()
    expect(histSeries.update).not.toHaveBeenCalled()
  })
})
