import type { IChartApi } from 'lightweight-charts'
import type { Timeframe } from '@/constants/chart'

export {}

declare global {
  interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
  }

  interface SpeechRecognitionResult {
    readonly length: number
    readonly isFinal: boolean
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
  }

  interface SpeechRecognitionResultList {
    readonly length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number
    readonly results: SpeechRecognitionResultList
  }

  interface SpeechRecognition extends EventTarget {
    lang: string
    interimResults: boolean
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onend: ((event: Event) => void) | null
    onerror: ((event: Event) => void) | null
    start(): void
    stop(): void
    abort(): void
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition
    new (): SpeechRecognition
  } | undefined

  var webkitSpeechRecognition: {
    prototype: SpeechRecognition
    new (): SpeechRecognition
  } | undefined

  interface Window {
    __chartInstance?: IChartApi | null
    __getChartElement?: () => HTMLElement | null
    toggleIndicator?: (name: string, enabled?: boolean) => void
    changeTimeframe?: (timeframe: Timeframe) => void
  }
}
