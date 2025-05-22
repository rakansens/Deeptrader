import { NEXT_PUBLIC_BINANCE_WS_BASE_URL } from './env'

const RECONNECT_DELAY = 1000; // ms – wait 1 s before trying to reconnect

export type Listener = (data: unknown) => void

interface StreamInfo {
  ws: WebSocket
  listeners: Set<Listener>
  refs: number
  keepAlive?: NodeJS.Timeout
  reconnectTimer?: NodeJS.Timeout
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
      // a temporary dummy – will be overwritten by connect()
      // @ts-expect-error overwrite later
      ws: null,
      listeners: new Set(),
      refs: 0
    }

    const connect = () => {
      // clear any pending timer before a fresh connect
      if (info.reconnectTimer) {
        clearTimeout(info.reconnectTimer)
        info.reconnectTimer = undefined
      }

      const ws = new WebSocket(`${NEXT_PUBLIC_BINANCE_WS_BASE_URL}/stream?streams=${stream}`)
      info.ws = ws

      // start / stop keep‑alive
      const startKeepAlive = () => {
        info.keepAlive = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send('{}')
            } catch {
              /* ignore */
            }
          }
        }, 25_000)
      }
      const stopKeepAlive = () => {
        if (info.keepAlive) {
          clearInterval(info.keepAlive)
          info.keepAlive = undefined
        }
      }

      ws.addEventListener('open', startKeepAlive)

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
        stopKeepAlive()

        // if still used somewhere, reconnect, otherwise flush completely
        if (info.refs > 0) {
          info.reconnectTimer = setTimeout(connect, RECONNECT_DELAY)
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
