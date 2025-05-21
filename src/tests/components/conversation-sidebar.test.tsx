import { render, screen, within } from '@testing-library/react'
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

  it('filters conversations by title', async () => {
    const user = userEvent.setup()
    render(
      <ConversationSidebar conversations={conversations} onSelect={() => {}} />
    )
    const input = screen.getByPlaceholderText('会話を検索...')
    await user.type(input, 'Tw')
    expect(screen.queryByText('One')).not.toBeInTheDocument()
    expect(screen.getByText('Two')).toBeInTheDocument()
  })

  it('filter input is focusable via tab', async () => {
    const user = userEvent.setup()
    render(
      <ConversationSidebar conversations={conversations} onSelect={() => {}} />
    )
    await user.tab()
    expect(screen.getByPlaceholderText('会話を検索...')).toHaveFocus()
  })

  it('renames conversation', async () => {
    const user = userEvent.setup()
    const onRename = jest.fn()
    render(
      <ConversationSidebar
        conversations={conversations}
        onSelect={() => {}}
        onRename={onRename}
      />
    )
    await user.click(screen.getAllByLabelText('rename')[0])
    const dialog = await screen.findByRole('dialog')
    await user.clear(screen.getByPlaceholderText('新しい会話名'))
    await user.type(screen.getByPlaceholderText('新しい会話名'), 'New')
    await user.click(within(dialog).getByRole('button', { name: '保存' }))
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
    await screen.findByRole('alertdialog')
    await user.click(screen.getByRole('button', { name: '削除' }))
    expect(onRemove).toHaveBeenCalledWith('2')
  })
})
