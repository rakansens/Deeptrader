import { renderHook, act } from '@testing-library/react'
import { useConversations } from '@/hooks/chat/use-conversations'

describe('useConversations', () => {
  it('renames and removes conversations', () => {
    const { result } = renderHook(() => useConversations())

    act(() => {
      result.current.renameConversation('current', 'renamed')
    })
    expect(result.current.conversations[0].title).toBe('renamed')

    act(() => {
      const id = result.current.newConversation()
      result.current.removeConversation(id)
    })
    expect(result.current.conversations.length).toBe(1)
  })

  it('persists conversations to localStorage', () => {
    localStorage.setItem('conversations', JSON.stringify([{ id: 'a', title: 'old' }]))
    localStorage.setItem('selectedConversation', 'a')

    const { result } = renderHook(() => useConversations())
    expect(result.current.selectedId).toBe('a')
    expect(result.current.conversations[0].title).toBe('old')

    act(() => {
      result.current.renameConversation('a', 'new')
    })
    expect(JSON.parse(localStorage.getItem('conversations') || '[]')[0].title).toBe('new')
  })

  it('removes stored messages when deleting a conversation', () => {
    localStorage.setItem('conversations', JSON.stringify([{ id: 'x', title: 't' }]))
    localStorage.setItem('selectedConversation', 'x')
    localStorage.setItem('messages_x', JSON.stringify([{ role: 'user', content: 'hi', timestamp: 0 }]))

    const { result } = renderHook(() => useConversations())

    act(() => {
      result.current.removeConversation('x')
    })

    expect(localStorage.getItem('messages_x')).toBeNull()
  })
})
