import { renderHook, act } from '@testing-library/react'
import { useVoiceInput } from '@/hooks/use-voice-input'

class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = []
  lang = ''
  interimResults = false
  onresult: ((e: SpeechRecognitionEvent) => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  started = false
  stopped = false
  aborted = false

  constructor() {
    MockSpeechRecognition.instances.push(this)
  }

  start() {
    this.started = true
  }
  stop() {
    this.stopped = true
  }
  abort() {
    this.aborted = true
  }
}

;(global as any).SpeechRecognition = MockSpeechRecognition as any

describe('useVoiceInput', () => {
  afterEach(() => {
    MockSpeechRecognition.instances.length = 0
  })

  it('starts and stops recognition', () => {
    const { result } = renderHook(() => useVoiceInput())

    act(() => {
      result.current.startListening()
    })

    const rec = MockSpeechRecognition.instances[0]
    expect(result.current.isListening).toBe(true)
    expect(rec.started).toBe(true)

    act(() => {
      result.current.stopListening()
    })

    expect(rec.stopped).toBe(true)
    expect(result.current.isListening).toBe(false)
  })
})
