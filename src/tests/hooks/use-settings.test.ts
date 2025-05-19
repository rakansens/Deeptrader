import { renderHook, act } from '@testing-library/react'
import { useSettings } from '@/hooks/use-settings'

describe('useSettings', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('loads state from localStorage', () => {
    localStorage.setItem('voiceInputEnabled', 'true')
    localStorage.setItem('speechSynthesisEnabled', 'false')
    const { result } = renderHook(() => useSettings())
    expect(result.current.voiceInputEnabled).toBe(true)
    expect(result.current.speechSynthesisEnabled).toBe(false)
  })

  it('persists state to localStorage', () => {
    const { result } = renderHook(() => useSettings())
    act(() => {
      result.current.setVoiceInputEnabled(true)
      result.current.setSpeechSynthesisEnabled(true)
    })
    expect(localStorage.getItem('voiceInputEnabled')).toBe('true')
    expect(localStorage.getItem('speechSynthesisEnabled')).toBe('true')
  })
})
