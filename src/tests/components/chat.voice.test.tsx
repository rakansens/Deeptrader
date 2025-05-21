import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Chat from '@/components/chat/Chat'
import { useSettings } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream } from 'stream/web'

global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder
global.ReadableStream = ReadableStream as any

jest.mock('@/hooks/use-settings')
jest.mock('@/hooks/use-toast')

const toastMock = jest.fn()
;(useToast as jest.Mock).mockReturnValue({ toast: toastMock, dismiss: jest.fn(), toasts: [] })

describe('Chat voice features', () => {
  beforeEach(() => {
    ;(useSettings as jest.Mock).mockReturnValue({
      voiceInputEnabled: true,
      setVoiceInputEnabled: jest.fn(),
      speechSynthesisEnabled: true,
      setSpeechSynthesisEnabled: jest.fn(),
      refreshSettings: jest.fn(),
      userAvatar: '',
      setUserAvatar: jest.fn(),
      assistantAvatar: '',
      setAssistantAvatar: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('updates input from speech recognition result', async () => {
    const user = userEvent.setup()
    const startMock = jest.fn()
    let instance: any
    class Rec {
      start() {
        startMock()
        instance = this
      }
      stop() {}
    }
    Object.defineProperty(window, 'SpeechRecognition', { value: Rec, configurable: true })
    render(<Chat />)
    
    // 音声入力ボタンを探す（aria-labelが変更されています）
    await user.click(screen.getByLabelText('音声入力を開始'))
    expect(startMock).toHaveBeenCalled()
    
    // 音声認識結果をシミュレート
    instance.onresult({ results: [[{ transcript: 'テスト' }]] })
    const textarea = screen.getByPlaceholderText('メッセージを入力...') as HTMLTextAreaElement
    await waitFor(() => expect(textarea.value).toBe('テスト'))
  })

  it('toggles listening state when mic button is clicked', async () => {
    const user = userEvent.setup()
    const startMock = jest.fn()
    const stopMock = jest.fn()
    
    class Rec {
      start() { 
        startMock() 
      }
      stop() { 
        stopMock() 
      }
    }
    
    Object.defineProperty(window, 'SpeechRecognition', { value: Rec, configurable: true })
    
    render(<Chat />)
    
    // 初期状態では「音声入力を開始」ボタンが表示されている
    const startButton = screen.getByLabelText('音声入力を開始')
    await user.click(startButton)
    expect(startMock).toHaveBeenCalled()
    
    // クリック後は「音声入力を停止」ボタンに変わる
    const stopButton = screen.getByLabelText('音声入力を停止')
    await user.click(stopButton)
    expect(stopMock).toHaveBeenCalled()
  })

  it('speaks assistant reply when enabled', async () => {
    const user = userEvent.setup()
    const speak = jest.fn()
    ;(window as any).speechSynthesis = {
      speak,
      cancel: jest.fn(),
      getVoices: () => [{ lang: 'ja-JP', name: 'ja' }]
    }
    ;(window as any).SpeechSynthesisUtterance = function (this: any, t: string) { this.text = t }
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('reply'))
        controller.close()
      }
    })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, body: stream, headers: new Headers() }) as any
    render(<Chat />)
    const textarea = screen.getByPlaceholderText('メッセージを入力...')
    await user.type(textarea, 'hi')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(speak).toHaveBeenCalled())
  })
})
