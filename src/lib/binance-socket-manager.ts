import { NEXT_PUBLIC_BINANCE_WS_BASE_URL } from './env'

export type Listener = (data: unknown) => void

interface StreamInfo {
  ws: WebSocket
  listeners: Set<Listener>
  refs: number
  keepAlive?: NodeJS.Timeout
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
    const ws = new WebSocket(`${NEXT_PUBLIC_BINANCE_WS_BASE_URL}/stream?streams=${stream}`)
    const info: StreamInfo = { ws, listeners: new Set(), refs: 0 }
    ws.addEventListener('open', () => {
      info.keepAlive = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.send('{}') } catch { /* ignore */ }
        }
      }, 25000)
    })
    ws.addEventListener('close', () => {
      if (info.keepAlive) clearInterval(info.keepAlive)
      this.streams.delete(stream)
    })
    ws.addEventListener('message', ev => {
      let data: unknown
      try { data = JSON.parse(ev.data) } catch { data = ev.data }
      info.listeners.forEach(l => l(data))
    })
    return info
  }

  private unsubscribe(stream: string, cb: Listener) {
    const info = this.streams.get(stream)
    if (!info) return
    info.listeners.delete(cb)
    info.refs -= 1
    if (info.refs <= 0) {
      if (info.keepAlive) clearInterval(info.keepAlive)
      info.ws.close()
      this.streams.delete(stream)
    }
  }
}

export const socketHub = new BinanceSocketManager()

