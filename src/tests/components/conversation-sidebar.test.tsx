import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConversationSidebar from '@/components/chat/conversation-sidebar'

const conversations = [
  { id: '1', title: 'One' },
  { id: '2', title: 'Two' },
]

describe('ConversationSidebar', () => {
  it('calls onSelect when item clicked', async () => {
    const user = userEvent.setup()
    const onSelect = jest.fn()
    render(<ConversationSidebar conversations={conversations} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: 'Two' }))
    expect(onSelect).toHaveBeenCalledWith('2')
  })
})
