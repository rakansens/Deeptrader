import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Chat from '@/components/chat/Chat'

describe('Chat new conversation', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  it('sidebar shows new chat button', () => {
    render(<Chat />)
    expect(screen.getByRole('button', { name: '新しいチャット' })).toBeInTheDocument()
  })

  it('creates new conversation and clears messages', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ reply: 'hi' }) } as Response)

    const user = userEvent.setup()
    render(<Chat />)

    const textarea = screen.getByPlaceholderText('メッセージを入力...')
    await user.type(textarea, 'hello{enter}')

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.getByText('hello')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '新しいチャット' }))

    expect(screen.queryByText('hello')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '会話 2' }).className).toMatch(/bg-accent/)
  })
})
