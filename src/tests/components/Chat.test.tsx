import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Chat from '@/components/chat/Chat'

jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }))

global.fetch = jest.fn((url: string) => {
  if (url === '/api/conversations') {
    return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 'c1' }]) }) as any
  }
  if (url.startsWith('/api/messages')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }) as any
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({ reply: 'ok' }) }) as any
})

describe('Chat component', () => {
  afterEach(() => {
    ;(fetch as jest.Mock).mockClear()
  })

  it('loads conversations on mount', async () => {
    render(<Chat />)
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/conversations')
    })
  })

  it('sends message', async () => {
    render(<Chat />)
    const input = screen.getByPlaceholderText('メッセージを入力...')
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/messages'),
        expect.any(Object)
      )
    })
  })
})
