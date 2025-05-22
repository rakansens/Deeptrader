import { NEXT_PUBLIC_HUB_WS_URL } from './env'

export type Listener = (data: unknown) => void

interface StreamInfo {
  ws: WebSocket
  listeners: Set<Listener>
  refs: number
  pingTimer?: NodeJS.Timeout
  retryCount: number
  reconnectTimer?: NodeJS.Timeout
}

export class HubSocketManager {
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
    const info: StreamInfo = {
      // @ts-expect-error set below
      ws: null,
      listeners: new Set(),
      refs: 0,
      retryCount: 0
    }

    const connect = () => {
      if (info.reconnectTimer) {
        clearTimeout(info.reconnectTimer)
        info.reconnectTimer = undefined
      }
      const ws = new WebSocket(`${NEXT_PUBLIC_HUB_WS_URL}?stream=${stream}`)
      info.ws = ws

      const schedulePing = () => {
        if (ws.readyState === WebSocket.OPEN) {
          // Ping は Hub 側のみで行うため、クライアント側は不要
          // try {
          //   ws.send('{}')
          // } catch {
          //   /* ignore */
          // }
          info.pingTimer = setTimeout(schedulePing, 30_000)
        }
      }
      const stopPing = () => {
        if (info.pingTimer) {
          clearTimeout(info.pingTimer)
          info.pingTimer = undefined
        }
      }

      ws.addEventListener('open', () => {
        info.retryCount = 0
        // ストリーム購読メッセージをサーバーに送信
        try {
          ws.send(JSON.stringify({ type: 'subscribe', stream }))
        } catch (e) {
          console.error('Failed to send subscribe message', e)
        }
        // schedulePing() // 不要なのでコメントアウト
      })

      ws.addEventListener('message', ev => {
        let data: unknown
        try {
          data = JSON.parse(ev.data as string)
        } catch {
          data = ev.data
        }
        info.listeners.forEach(l => l(data))
      })

      const handleCloseOrError = () => {
        stopPing()
        if (info.refs > 0) {
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

    connect()
    return info
  }

  private unsubscribe(stream: string, cb: Listener) {
    const info = this.streams.get(stream)
    if (!info) return
    info.listeners.delete(cb)
    info.refs -= 1
    if (info.refs <= 0 && info.reconnectTimer) {
      clearTimeout(info.reconnectTimer)
      info.reconnectTimer = undefined
    }
    if (info.refs <= 0) {
      if (info.pingTimer) clearTimeout(info.pingTimer)
      // 切断前に unsubscribe メッセージを送信
      try {
        if (info.ws.readyState === WebSocket.OPEN) {
          info.ws.send(JSON.stringify({ type: 'unsubscribe', stream }))
        }
      } catch (e) {
        console.error('Failed to send unsubscribe message', e)
      }
      info.ws.close()
      this.streams.delete(stream)
    }
  }
}

export const hubSdk = new HubSocketManager()
