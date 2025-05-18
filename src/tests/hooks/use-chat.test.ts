import { renderHook, act } from '@testing-library/react'
import { useChat } from '@/hooks/use-chat'

describe('useChat', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  it('sends message and stores reply', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'pong' })
    }) as unknown as typeof fetch

    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.setInput('ping')
    })

    await act(async () => {
      await result.current.sendMessage()
    })

    expect(result.current.messages[0]).toEqual({ role: 'user', content: 'ping' })
    expect(result.current.messages[1]).toEqual({ role: 'assistant', content: 'pong' })
  })
})
