import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    
    // DataTransferオブジェクトのモックを作成し、型キャストを修正
    const dataTransferMock = {
      files: [file],
      items: { add: jest.fn() },
      getData: jest.fn(),
      setData: jest.fn(),
      clearData: jest.fn(),
      setDragImage: jest.fn(),
      effectAllowed: 'none',
      dropEffect: 'none',
      types: []
    } as unknown as DataTransfer;
    
    await fireEvent.drop(container, { dataTransfer: dataTransferMock })
    await waitFor(() => expect(onUploadImage).toHaveBeenCalledWith(file))
  })

  it('shows spinner with motion-safe class while uploading', async () => {
    const user = userEvent.setup()
    let resolve: () => void
    const onUploadImage = jest.fn(
      () =>
        new Promise<void>(r => {
          resolve = r
        })
    )
    render(<ChatInput {...baseProps} onUploadImage={onUploadImage} />)
    const input = screen.getByTestId('image-input') as HTMLInputElement
    const file = new File(['data'], 'test.png', { type: 'image/png' })
    await user.upload(input, file)
    const uploadButton = screen.getByLabelText('画像をアップロード')
    await waitFor(() => {
      const svg = uploadButton.querySelector('svg')!
      expect(svg.getAttribute('class')).toContain('motion-safe:animate-spin')
    })
    resolve!
    await waitFor(() => expect(onUploadImage).toHaveBeenCalled())
  })
})
