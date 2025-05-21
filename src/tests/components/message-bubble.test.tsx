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
    const bubble = screen.getByTestId('message-bubble')
    const inner = bubble.querySelector('.rounded-lg')!
    expect(inner.className).toContain('motion-safe:animate-pulse')
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

  it('shows fallback avatar when none provided', () => {
    render(<MessageBubble role="assistant">hi</MessageBubble>)
    // Fallback text 'AI' should be visible
    expect(screen.getAllByText('AI')[0]).toBeInTheDocument()
  })


  it('applies animation classes', () => {
    render(<MessageBubble role="assistant">hi</MessageBubble>)
    const bubble = screen.getByTestId('message-bubble')
    expect(bubble.className).toContain('motion-safe:transition-transform')
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
