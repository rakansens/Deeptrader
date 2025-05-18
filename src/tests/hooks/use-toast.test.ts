import { renderHook, act } from '@testing-library/react'
import { useToast, toast, __TEST__listeners } from '@/hooks/use-toast'

describe('useToast', () => {
  it('does not register multiple listeners on rerender', () => {
    const { result, rerender } = renderHook(() => useToast())
    const initialListeners = __TEST__listeners?.length ?? 0

    rerender()
    rerender()

    act(() => {
      toast({ title: 'test' })
    })

    // Listener count should remain the same after rerenders
    expect(__TEST__listeners?.length).toBe(initialListeners)
    // Only one toast should be added
    expect(result.current.toasts).toHaveLength(1)
  })
})
