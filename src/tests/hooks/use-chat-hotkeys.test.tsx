import { render, fireEvent } from '@testing-library/react'
import { useChatHotkeys } from '@/hooks/chat/use-chat-hotkeys'

function TestComponent(props: Parameters<typeof useChatHotkeys>[0]) {
  useChatHotkeys(props)
  return null
}

describe('useChatHotkeys', () => {
  it('calls handlers on key press', () => {
    const onScreenshot = jest.fn()
    const onToggleSidebar = jest.fn()
    const onToggleVoice = jest.fn()
    render(
      <TestComponent
        onScreenshot={onScreenshot}
        onToggleSidebar={onToggleSidebar}
        onToggleVoice={onToggleVoice}
      />,
    )
    fireEvent.keyDown(window, { key: 's', ctrlKey: true, shiftKey: true })
    expect(onScreenshot).toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(onToggleSidebar).toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'm', ctrlKey: true })
    expect(onToggleVoice).toHaveBeenCalled()
  })
})
