import { renderHook, act } from '@testing-library/react'
import { useSettings } from '@/hooks/use-settings'

describe('useSettings', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('loads state from localStorage', () => {
    localStorage.setItem('voiceInputEnabled', 'true')
    localStorage.setItem('speechSynthesisEnabled', 'false')
    localStorage.setItem('userAvatar', 'me.png')
    localStorage.setItem('assistantAvatar', 'ai.png')
    const { result } = renderHook(() => useSettings())
    expect(result.current.voiceInputEnabled).toBe(true)
    expect(result.current.speechSynthesisEnabled).toBe(false)
    expect(result.current.userAvatar).toBe('me.png')
    expect(result.current.assistantAvatar).toBe('ai.png')
  })

  it('persists state to localStorage', () => {
    const { result } = renderHook(() => useSettings())
    act(() => {
      result.current.setVoiceInputEnabled(true)
      result.current.setSpeechSynthesisEnabled(true)
      result.current.setUserAvatar('me.png')
      result.current.setAssistantAvatar('ai.png')
    })
    expect(localStorage.getItem('voiceInputEnabled')).toBe('true')
    expect(localStorage.getItem('speechSynthesisEnabled')).toBe('true')
    expect(localStorage.getItem('userAvatar')).toBe('me.png')
    expect(localStorage.getItem('assistantAvatar')).toBe('ai.png')
  })
})
