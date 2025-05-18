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
})
