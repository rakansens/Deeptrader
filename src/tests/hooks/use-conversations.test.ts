import { renderHook, act } from '@testing-library/react'
import { useConversations } from '@/hooks/use-conversations'

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
})
