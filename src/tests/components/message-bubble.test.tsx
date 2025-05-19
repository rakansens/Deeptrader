import { render, screen } from '@testing-library/react'
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
    expect(screen.getByText('DeepTrader AI')).toBeInTheDocument()
    expect(screen.getByText(new Date(0).toLocaleString())).toBeInTheDocument()
  })
})
