import { renderHook } from '@testing-library/react'
import useChartTheme from '@/hooks/use-chart-theme'
import { useTheme } from 'next-themes'

jest.mock('next-themes', () => ({
  useTheme: jest.fn()
}))

describe('useChartTheme', () => {
  it('returns dark colors when theme is dark', () => {
    ;(useTheme as jest.Mock).mockReturnValue({ theme: 'dark' })
    const { result } = renderHook(() => useChartTheme())
    expect(result.current.background).toBe('#1e1e1e')
    expect(result.current.text).toBe('#d1d5db')
  })

  it('returns light colors when theme is light', () => {
    ;(useTheme as jest.Mock).mockReturnValue({ theme: 'light' })
    const { result } = renderHook(() => useChartTheme())
    expect(result.current.background).toBe('#ffffff')
    expect(result.current.text).toBe('#111827')
  })
})
