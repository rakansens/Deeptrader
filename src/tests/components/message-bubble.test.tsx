import { render, screen } from '@testing-library/react'
import MessageBubble from '@/components/chat/message-bubble'

describe('MessageBubble', () => {
  it('displays user label', () => {
    render(<MessageBubble role="user">hi</MessageBubble>)
    expect(screen.getByText('あなた')).toBeInTheDocument()
  })

  it('applies typing animation', () => {
    render(
      <MessageBubble role="assistant" typing>
        typing
      </MessageBubble>
    )
    const content = screen.getByText('typing')
    expect(content.className).toMatch(/animate-pulse/)
  })
})
