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

  it('renames conversation', async () => {
    const user = userEvent.setup()
    const onRename = jest.fn()
    jest.spyOn(window, 'prompt').mockReturnValue('New')
    render(
      <ConversationSidebar
        conversations={conversations}
        onSelect={() => {}}
        onRename={onRename}
      />
    )
    await user.click(screen.getAllByLabelText('rename')[0])
    expect(onRename).toHaveBeenCalledWith('1', 'New')
  })

  it('deletes conversation', async () => {
    const user = userEvent.setup()
    const onRemove = jest.fn()
    render(
      <ConversationSidebar
        conversations={conversations}
        onSelect={() => {}}
        onRemove={onRemove}
      />
    )
    await user.click(screen.getAllByLabelText('delete')[1])
    expect(onRemove).toHaveBeenCalledWith('2')
  })
})
