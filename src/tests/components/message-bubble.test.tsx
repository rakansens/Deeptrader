import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MessageBubble from '@/components/chat/message-bubble'
import { formatDateTime } from '@/lib/format'

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
    expect(screen.getByText('DeepTrader AI')).toBeInTheDocument()
    expect(screen.getByText(formatDateTime(0))).toBeInTheDocument()
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
})
