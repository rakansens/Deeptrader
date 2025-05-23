import { preprocessLineData, processTimeSeriesData } from '@/lib/chart'
import type { LineData, UTCTimestamp } from 'lightweight-charts'

describe('chart-utils', () => {
  describe('preprocessLineData', () => {
    it('sorts and deduplicates line data', () => {
      const input: LineData<UTCTimestamp>[] = [
        { time: 3 as UTCTimestamp, value: 1 },
        { time: 1 as UTCTimestamp, value: 2 },
        { time: 2 as UTCTimestamp, value: 3 },
        { time: 2 as UTCTimestamp, value: 4 }
      ]
      const result = preprocessLineData(input)
      expect(result).toEqual([
        { time: 1, value: 2 },
        { time: 2, value: 3 },
        { time: 3, value: 1 }
      ])
    })
  })

  describe('processTimeSeriesData', () => {
    it('processes generic series data', () => {
      const input = [
        { time: 2 as UTCTimestamp, foo: 'a' },
        { time: 1 as UTCTimestamp, foo: 'b' },
        { time: 1 as UTCTimestamp, foo: 'c' }
      ]
      const result = processTimeSeriesData(input, t => t as number)
      expect(result).toEqual([
        { time: 1, foo: 'b' },
        { time: 2, foo: 'a' }
      ])
    })
  })
})
