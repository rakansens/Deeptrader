import { renderHook, act } from '@testing-library/react'
import useSidebar from '@/hooks/chat/use-sidebar'

describe('useSidebar', () => {
  it('toggles sidebar state', () => {
    const { result } = renderHook(() => useSidebar(false))
    act(() => {
      result.current.toggleSidebar()
    })
    expect(result.current.sidebarOpen).toBe(true)
  })
})
