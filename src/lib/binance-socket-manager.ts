import { NEXT_PUBLIC_BINANCE_WS_BASE_URL } from './env'

const RECONNECT_DELAY = 1000; // ms – wait 1 s before trying to reconnect

export type Listener = (data: unknown) => void

interface StreamInfo {
  ws: WebSocket
  listeners: Set<Listener>
  refs: number
  pingTimer?: NodeJS.Timeout
  retryCount: number // exponential‑back‑off counter
  reconnectTimer?: NodeJS.Timeout
  keepAlive?: NodeJS.Timeout // キープアライブタイマー
}

export class BinanceSocketManager {
  private streams = new Map<string, StreamInfo>()

  subscribe(stream: string, cb: Listener): { ws: WebSocket; unsubscribe: () => void } {
    let info = this.streams.get(stream)
    if (!info) {
      info = this.create(stream)
      this.streams.set(stream, info)
    }
    info.refs += 1
    info.listeners.add(cb)
    return {
      ws: info.ws,
      unsubscribe: () => this.unsubscribe(stream, cb)
    }
  }

  private create(stream: string): StreamInfo {
    // prepare the record first so inner helpers can refer to it
    const info: StreamInfo = {
      // @ts-expect-error will be set immediately
      ws: null,
      listeners: new Set(),
      refs: 0,
      retryCount: 0
    }

    const connect = () => {
      // clear any pending timer before a fresh connect
      if (info.reconnectTimer) {
        clearTimeout(info.reconnectTimer)
        info.reconnectTimer = undefined
      }

      const ws = new WebSocket(`${NEXT_PUBLIC_BINANCE_WS_BASE_URL}/stream?streams=${stream}`)
      info.ws = ws

      // local helper to send one ping and reschedule itself
      const schedulePing = () => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send('{}')
          } catch {
            /* ignore */
          }
          info.pingTimer = setTimeout(schedulePing, 30_000) // 30 s later
        }
      }
      const stopPing = () => {
        if (info.pingTimer) {
          clearTimeout(info.pingTimer)
          info.pingTimer = undefined
        }
      }

      // once the socket is open, reset retry counter and start ping cycle
      ws.addEventListener('open', () => {
        info.retryCount = 0
        schedulePing()
      })

      ws.addEventListener('message', ev => {
        let data: unknown
        try {
          data = JSON.parse(ev.data)
        } catch {
          data = ev.data
        }
        info.listeners.forEach(l => l(data))
      })

      const handleCloseOrError = () => {
        stopPing()

        if (info.refs > 0) {
          // exponential back‑off: 1s, 2s, 4s … capped at 30s
          info.retryCount += 1
          const delay = Math.min(30_000, 2 ** info.retryCount * 1_000)
          info.reconnectTimer = setTimeout(connect, delay)
        } else {
          this.streams.delete(stream)
        }
      }

      ws.addEventListener('close', handleCloseOrError)
      ws.addEventListener('error', handleCloseOrError)
    }

    // do the first connect immediately
    connect()
    return info
  }

  private unsubscribe(stream: string, cb: Listener) {
    const info = this.streams.get(stream)
    if (!info) return
    info.listeners.delete(cb)
    info.refs -= 1
    // if no one is listening, ensure pending reconnects/keep‑alives are cleared
    if (info.refs <= 0 && info.reconnectTimer) {
      clearTimeout(info.reconnectTimer)
      info.reconnectTimer = undefined
    }
    if (info.refs <= 0) {
      if (info.keepAlive) clearInterval(info.keepAlive)
      info.ws.close()
      this.streams.delete(stream)
    }
  }
}

export const socketHub = new BinanceSocketManager()
