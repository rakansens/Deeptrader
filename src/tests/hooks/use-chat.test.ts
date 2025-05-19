import { renderHook, act } from '@testing-library/react'
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream } from 'stream/web'

global.TextEncoder = TextEncoder
global.ReadableStream = ReadableStream as any
global.TextDecoder = TextDecoder
import { useChat } from '@/hooks/use-chat'

describe('useChat', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  it('sends message and stores reply', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('pong'))
        controller.close()
      }
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: stream,
      headers: new Headers()
    }) as unknown as typeof fetch

    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.setInput('ping')
    })

    await act(async () => {
      await result.current.sendMessage()
    })

    expect(result.current.messages[0].role).toBe('user')
    expect(result.current.messages[0].content).toBe('ping')
    expect(typeof result.current.messages[0].timestamp).toBe('number')
    expect(result.current.messages[1].role).toBe('assistant')
    expect(result.current.messages[1].content).toBe('pong')
  })
})
