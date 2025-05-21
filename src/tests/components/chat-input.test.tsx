import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatInput from '@/components/chat/chat-input'

const baseProps = {
  input: '',
  setInput: jest.fn(),
  loading: false,
  onSendMessage: jest.fn(),
  onScreenshot: jest.fn(),
  voiceInputEnabled: false,
  isListening: false,
  toggleListening: jest.fn(),
  recordingTime: 0,
}

describe('ChatInput drag and drop', () => {
  it('applies highlight on drag over', () => {
    render(<ChatInput {...baseProps} onUploadImage={jest.fn()} />)
    const container = screen.getByTestId('chat-input')
    fireEvent.dragOver(container)
    expect(container.className).toContain('ring-2')
  })

  it('calls onUploadImage on drop', async () => {
    const onUploadImage = jest.fn()
    render(<ChatInput {...baseProps} onUploadImage={onUploadImage} />)
    const container = screen.getByTestId('chat-input')
    const file = new File(['data'], 'test.png', { type: 'image/png' })
    const data = new DataTransfer()
    data.items.add(file)
    await fireEvent.drop(container, { dataTransfer: data })
    await waitFor(() => expect(onUploadImage).toHaveBeenCalledWith(file))
  })
})
