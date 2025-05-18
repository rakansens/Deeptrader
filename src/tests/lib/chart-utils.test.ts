import { preprocessLineData, processTimeSeriesData, toNumericTime } from '@/lib/chart-utils'
import type { LineData } from 'lightweight-charts'

describe('chart-utils', () => {
  describe('preprocessLineData', () => {
    it('sorts and deduplicates line data', () => {
      const input: LineData[] = [
        { time: 3, value: 1 },
        { time: 1, value: 2 },
        { time: 2, value: 3 },
        { time: 2, value: 4 }
      ]
      const result = preprocessLineData(input)
      expect(result).toEqual([
        { time: 1, value: 2 },
        { time: 2, value: 3 },
        { time: 3, value: 1 }
      ])
    })
  })

  describe('toNumericTime', () => {
    it('converts various time formats to seconds', () => {
      const date = new Date('2024-01-02T03:04:05Z')
      const bd = { year: 2024, month: 1, day: 2 }
      expect(toNumericTime(1714561445)).toBe(1714561445)
      expect(toNumericTime(date)).toBe(Math.floor(date.getTime() / 1000))
      expect(toNumericTime(bd)).toBe(Math.floor(new Date('2024-01-02').getTime() / 1000))
    })
  })

  describe('processTimeSeriesData', () => {
    it('processes generic series data', () => {
      const input = [
        { time: 2, foo: 'a' },
        { time: 1, foo: 'b' },
        { time: 1, foo: 'c' }
      ]
      const result = processTimeSeriesData(input, t => t as number)
      expect(result).toEqual([
        { time: 1, foo: 'b' },
        { time: 2, foo: 'a' }
      ])
    })
  })
})
