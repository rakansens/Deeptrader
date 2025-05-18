import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Chat from '@/components/chat/Chat'


describe('Chat', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'AI reply' }),
    }) as jest.Mock
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  it('初期表示でサジェストが表示される', () => {
    render(<Chat />)
    expect(screen.getByText('質問や指示を入力してください')).toBeInTheDocument()
  })

  it('メッセージ送信後に会話が表示される', async () => {
    const user = userEvent.setup()
    render(<Chat />)
    const textarea = screen.getByPlaceholderText('メッセージを入力...')
    await user.type(textarea, 'こんにちは')
    const sendButton = screen.getByRole('button', { name: '' })
    await user.click(sendButton)

    expect(await screen.findByText('こんにちは')).toBeInTheDocument()
    expect(await screen.findByText('AI reply')).toBeInTheDocument()
  })
})
