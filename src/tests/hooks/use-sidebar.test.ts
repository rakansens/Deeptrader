import { renderHook, act } from '@testing-library/react'
import useSidebar from '@/hooks/use-sidebar'

describe('useSidebar', () => {
  it('toggles sidebar and dispatches resize', () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')
    const { result } = renderHook(() => useSidebar(false))
    act(() => {
      result.current.toggleSidebar()
    })
    expect(result.current.sidebarOpen).toBe(true)
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event))
    expect((dispatchSpy.mock.calls[0][0] as Event).type).toBe('resize')
  })
})
