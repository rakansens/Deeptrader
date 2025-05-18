import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Chat from '@/components/chat/Chat'

describe('Chat', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  describe('メッセージ送信機能', () => {
    it('submits message and displays assistant reply', async () => {
      const user = userEvent.setup()
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ reply: 'hi there' })
      } as Response)

      render(<Chat />)
      const textarea = screen.getByPlaceholderText('メッセージを入力...')
      await user.type(textarea, 'hello')
      await user.keyboard('{Enter}')

      await waitFor(() => expect(global.fetch).toHaveBeenCalled())
      expect(screen.getByText('あなた')).toBeInTheDocument()
      await waitFor(() => expect(screen.getByText('hi there')).toBeInTheDocument())
      expect(screen.getByText('DeepTrader AI')).toBeInTheDocument()
    })

    it('shows loading indicator while waiting for response', async () => {
      const user = userEvent.setup()
      let resolveFetch: (value: Response) => void
      const fetchPromise = new Promise<Response>(r => { resolveFetch = r })
      global.fetch = jest.fn().mockReturnValue(fetchPromise)

      render(<Chat />)
      const textarea = screen.getByPlaceholderText('メッセージを入力...')
      await user.type(textarea, 'loading')
      await user.keyboard('{Enter}')
      expect(screen.getByText('考え中...')).toBeInTheDocument()
      resolveFetch!({ ok: true, json: async () => ({ reply: 'done' }) } as Response)
      await waitFor(() => expect(screen.queryByText('考え中...')).not.toBeInTheDocument())
    })

    it('displays error message when API fails', async () => {
      const user = userEvent.setup()
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'fail' })
      } as Response)

      render(<Chat />)
      const textarea = screen.getByPlaceholderText('メッセージを入力...')
      await user.type(textarea, 'err')
      await user.keyboard('{Enter}')

      await waitFor(() => expect(screen.getByText('fail')).toBeInTheDocument())
      expect(screen.getByText('すみません、エラーが発生しました: fail')).toBeInTheDocument()
    })
  })

  describe('新しい会話機能', () => {
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
})
