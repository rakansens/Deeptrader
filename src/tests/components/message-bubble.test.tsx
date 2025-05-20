import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MessageBubble from '@/components/chat/message-bubble'

describe('MessageBubble', () => {
  it('displays user label', () => {
    render(<MessageBubble role="user">hi</MessageBubble>)
    expect(screen.getByText('あなた')).toBeInTheDocument()
  })

  it('shows typing indicator', () => {
    render(
      <MessageBubble role="assistant" typing>
        typing
      </MessageBubble>
    )
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
  })

  it('displays timestamp and avatar', () => {
    render(
      <MessageBubble role="assistant" timestamp={0} avatar="avatar.png">
        hi
      </MessageBubble>
    )
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText(/\d{4}\/\d{1,2}\/\d{1,2}/)).toBeInTheDocument()
  })

  it('copies message text to clipboard', async () => {
    const user = userEvent.setup()
    const writeText = jest.fn()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    render(<MessageBubble role="assistant">copy me</MessageBubble>)
    await user.click(screen.getByLabelText('コピー'))
    expect(writeText).toHaveBeenCalledWith('copy me')
  })

  it('renders image when type is image', () => {
    const data = 'data:image/png;base64,aaa'
    render(
      <MessageBubble role="user" type="image" prompt="prompt">
        {data}
      </MessageBubble>
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', data)
    expect(screen.getByText('prompt')).toBeInTheDocument()
  })

  it('renders image from imageUrl', () => {
    render(
      <MessageBubble role="user" type="image" imageUrl="http://example.com/img.png">
        画像
      </MessageBubble>
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'http://example.com/img.png')
  })
})
