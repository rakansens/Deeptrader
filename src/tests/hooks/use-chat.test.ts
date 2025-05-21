import { renderHook, act, waitFor } from '@testing-library/react'
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream } from 'stream/web'

import type { OpenAIChatMessage } from '@/types'

jest.mock('ai/react', () => {
  return {
    useChat: <T,>({ initialMessages }: { initialMessages?: T[] }) => {
      const React = require('react') as typeof import('react')
      const [messages, setMessages] = React.useState<T[]>(initialMessages || [])
      const [input, setInput] = React.useState('')
      const append = async (msg: T) => {
        setMessages((prev: T[]) => [...prev, msg, { role: 'assistant', content: 'pong' } as T])
      }
      return { messages, input, setInput, append, setMessages, isLoading: false, error: null }
    }
  }
})

global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder
global.ReadableStream = ReadableStream as any
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder
import { useChat } from '@/hooks/chat/use-chat'

describe('useChat', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
    localStorage.clear()
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

  it('loads messages from localStorage', async () => {
    localStorage.setItem(
      'messages_current',
      JSON.stringify([{ role: 'user', content: 'saved', timestamp: 1 }])
    )

    const { result } = renderHook(() => useChat())
    
    await waitFor(() => expect(result.current.messages.length).toBe(1), { timeout: 3000 })
    expect(result.current.messages[0].content).toBe('saved')
    expect(Array.isArray(result.current.messages)).toBe(true)
  })

  it('persists messages to localStorage', async () => {
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

    const stored = JSON.parse(localStorage.getItem('messages_current') || '[]')
    expect(stored[0].content).toBe('ping')
    expect(stored[1].content).toBe('pong')
  })
})
