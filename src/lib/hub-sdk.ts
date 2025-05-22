import { NEXT_PUBLIC_HUB_WS_URL, NEXT_PUBLIC_BINANCE_WS_BASE_URL } from './env'

export type Listener = (data: unknown) => void

interface StreamInfo {
  ws: WebSocket
  listeners: Set<Listener>
  refs: number
  pingTimer?: NodeJS.Timeout
  retryCount: number
  reconnectTimer?: NodeJS.Timeout
  closingTimer?: NodeJS.Timeout
  directConnection?: boolean // 直接Binanceに接続しているかフラグ
}

export class HubSocketManager {
  private streams = new Map<string, StreamInfo>()
  
  // Hubサーバー接続URLを正規化する関数
  private normalizeHubUrl(url: string): string {
    // URLが既に/wsで終わっている場合はそのまま返す
    if (url.endsWith('/ws')) {
      return url;
    }
    
    // URLの末尾のスラッシュを削除
    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    // /wsを追加
    return `${baseUrl}/ws`;
  }

  subscribe(stream: string, cb: Listener): { ws: WebSocket; unsubscribe: () => void } {
    console.log(`[HubSDK] Subscribing to stream: ${stream}`);
    
    // 直接Binanceに接続するかどうかチェック
    const useDirectBinance =
      process.env.NEXT_PUBLIC_USE_DIRECT_BINANCE === 'true';
      
    if (useDirectBinance) {
      console.log(`[HubSDK] Using direct Binance connection for stream: ${stream}`);
    } else {
      const normalizedUrl = this.normalizeHubUrl(NEXT_PUBLIC_HUB_WS_URL);
      console.log(`[HubSDK] Using Hub WebSocket URL: ${normalizedUrl}`);
    }
    
    let info = this.streams.get(stream)
    if (!info) {
      console.log(`[HubSDK] Creating new connection for stream: ${stream}`);
      info = this.create(stream)
      if (info.closingTimer) {
        clearTimeout(info.closingTimer);
        info.closingTimer = undefined;
      }
      this.streams.set(stream, info)
    } else {
      console.log(`[HubSDK] Reusing existing connection for stream: ${stream}`);
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

    const connectToBinance = () => {
      console.log(`[HubSDK] Attempting direct connection to Binance for stream: ${stream}`);
      
      // Binanceへの直接接続
      const binanceWsUrl = `${NEXT_PUBLIC_BINANCE_WS_BASE_URL}/stream?streams=${stream}`;
      console.log(`[HubSDK] Connecting directly to Binance: ${binanceWsUrl}`);
      
      const ws = new WebSocket(binanceWsUrl);
      info.ws = ws;
      info.directConnection = true;

      ws.addEventListener('open', () => {
        console.log(`[HubSDK] Direct Binance WebSocket connection opened for ${stream}`);
        info.retryCount = 0;
      });

      ws.addEventListener('message', ev => {
        let data: unknown;
        try {
          data = JSON.parse(ev.data as string);
          // Binanceからのデータ形式に合わせて変換
          if (typeof data === 'object' && data !== null && (data as any).data) {
            // Binanceからのデータはすでに正しい形式なのでそのまま使用
            const preview = { ...data } as Record<string, any>;
            if (Array.isArray((data as any).data?.bids)) {
              preview.data.bids = `Array(${(data as any).data.bids.length})`;
            }
            if (Array.isArray((data as any).data?.asks)) {
              preview.data.asks = `Array(${(data as any).data.asks.length})`;
            }
            console.log(`[HubSDK] Received direct Binance data for ${stream}:`, preview);
          } else {
            console.log(`[HubSDK] Received direct Binance data for ${stream}:`, data);
          }
        } catch {
          console.log(`[HubSDK] Received non-JSON data from Binance for ${stream}`);
          data = ev.data;
        }
        info.listeners.forEach(l => l(data));
      });

      const handleCloseOrError = (event?: CloseEvent | Event) => {
        const reason = (event as CloseEvent | undefined)?.type === 'error' ? 'error' : 'close';
        const wasClean = (event as CloseEvent | undefined)?.wasClean ?? false;

        console.log(`[HubSDK] ${info.directConnection ? 'Binance' : 'Hub'} WebSocket ${reason} (clean=${wasClean}) for stream: ${stream}`);

        // if the socket was closed by us cleanly (code 1000) do **not** attempt reconnection
        if (wasClean) {
          this.streams.delete(stream);
          return;
        }

        if (info.refs > 0) {
          info.retryCount += 1;
          const delay = Math.min(120_000, 2 ** info.retryCount * 1_000);
          console.log(`[HubSDK] Will retry ${info.directConnection ? 'Binance' : 'Hub'} connection for ${stream} in ${delay}ms (attempt ${info.retryCount})`);
          info.reconnectTimer = setTimeout(
            info.directConnection ? connectToBinance : connectToHub,
            delay
          );
        } else {
          console.log(`[HubSDK] No references left for ${stream}, not reconnecting`);
          this.streams.delete(stream);
        }
      };

      ws.addEventListener('close', handleCloseOrError);
      ws.addEventListener('error', (e) => {
        console.error(`[HubSDK] Binance WebSocket error for ${stream}:`, e);
        handleCloseOrError(e);
      });
    };

    const connectToHub = () => {
      if (info.reconnectTimer) {
        clearTimeout(info.reconnectTimer);
        info.reconnectTimer = undefined;
      }
      
      // HubサーバーURLを正規化
      const normalizedHubUrl = this.normalizeHubUrl(NEXT_PUBLIC_HUB_WS_URL);
      const wsUrl = `${normalizedHubUrl}?stream=${stream}`;
      console.log(`[HubSDK] Connecting to Hub: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      info.ws = ws;
      info.directConnection = false;

      const schedulePing = () => {
        if (ws.readyState === WebSocket.OPEN) {
          info.pingTimer = setTimeout(schedulePing, 30_000);
        }
      };
      
      const stopPing = () => {
        if (info.pingTimer) {
          clearTimeout(info.pingTimer);
          info.pingTimer = undefined;
        }
      };

      ws.addEventListener('open', () => {
        console.log(`[HubSDK] Hub WebSocket connection opened for stream: ${stream}`);
        info.retryCount = 0;
        // ストリーム購読メッセージをサーバーに送信
        try {
          const subscribeMsg = JSON.stringify({ type: 'subscribe', stream });
          console.log(`[HubSDK] Sending subscribe message: ${subscribeMsg}`);
          ws.send(subscribeMsg);
        } catch (e) {
          console.error('[HubSDK] Failed to send subscribe message', e);
        }
      });

      ws.addEventListener('message', ev => {
        let data: unknown;
        try {
          data = JSON.parse(ev.data as string);
          // 受信メッセージの一部だけをログ表示（大量のログを回避）
          if (typeof data === 'object' && data !== null) {
            const preview = { ...data } as Record<string, any>;
            // 大きなデータ配列は件数だけ表示
            if (Array.isArray((data as any).bids)) {
              preview.bids = `Array(${(data as any).bids.length})`;
            }
            if (Array.isArray((data as any).asks)) {
              preview.asks = `Array(${(data as any).asks.length})`;
            }
            console.log(`[HubSDK] Received Hub data for ${stream}:`, preview);
          } else {
            console.log(`[HubSDK] Received Hub data for ${stream}:`, data);
          }
        } catch {
          console.log(`[HubSDK] Received non-JSON data from Hub for ${stream}`);
          data = ev.data;
        }
        info.listeners.forEach(l => l(data));
      });

      const handleCloseOrError = (event?: CloseEvent | Event) => {
        const reason = (event as CloseEvent | undefined)?.type === 'error' ? 'error' : 'close';
        const wasClean = (event as CloseEvent | undefined)?.wasClean ?? false;

        console.log(`[HubSDK] ${info.directConnection ? 'Binance' : 'Hub'} WebSocket ${reason} (clean=${wasClean}) for stream: ${stream}`);

        // if the socket was closed by us cleanly (code 1000) do **not** attempt reconnection
        if (wasClean) {
          this.streams.delete(stream);
          return;
        }

        if (info.refs > 0) {
          info.retryCount += 1;
          const delay = Math.min(120_000, 2 ** info.retryCount * 1_000);
          console.log(`[HubSDK] Will retry ${info.directConnection ? 'Binance' : 'Hub'} connection for ${stream} in ${delay}ms (attempt ${info.retryCount})`);
          info.reconnectTimer = setTimeout(
            info.directConnection ? connectToBinance : connectToHub,
            delay
          );
        } else {
          console.log(`[HubSDK] No references left for ${stream}, not reconnecting`);
          this.streams.delete(stream);
        }
      };

      ws.addEventListener('close', handleCloseOrError);
      ws.addEventListener('error', (e) => {
        console.error(`[HubSDK] Hub WebSocket error for ${stream}:`, e);
        handleCloseOrError(e);
      });
    };

    // 直接Binanceに接続するかどうかチェック
    const useDirectBinance =
      process.env.NEXT_PUBLIC_USE_DIRECT_BINANCE === 'true';
    
    if (useDirectBinance) {
      // 直接Binanceに接続
      connectToBinance();
    } else {
      // Hubサーバーへの接続を試みる
      connectToHub();
    }
    
    return info;
  }

  private unsubscribe(stream: string, cb: Listener) {
    console.log(`[HubSDK] Unsubscribing from stream: ${stream}`);
    const info = this.streams.get(stream);
    if (!info) return;
    info.listeners.delete(cb);
    info.refs -= 1;
    console.log(`[HubSDK] References remaining for ${stream}: ${info.refs}`);
    
    if (info.refs <= 0 && info.reconnectTimer) {
      clearTimeout(info.reconnectTimer);
      info.reconnectTimer = undefined;
    }
    
    if (info.refs <= 0) {
      // defer real close to avoid thrashing when components subscribe/unsubscribe rapidly
      if (info.closingTimer) clearTimeout(info.closingTimer);
      info.closingTimer = setTimeout(() => {
        if (info.pingTimer) clearTimeout(info.pingTimer);

        // send unsubscribe when using Hub
        if (!info.directConnection && info.ws.readyState === WebSocket.OPEN) {
          try {
            const unsubscribeMsg = JSON.stringify({ type: 'unsubscribe', stream });
            console.log(`[HubSDK] Sending unsubscribe message: ${unsubscribeMsg}`);
            info.ws.send(unsubscribeMsg);
          } catch (e) {
            console.error('[HubSDK] Failed to send unsubscribe message', e);
          }
        }

        info.ws.close(1000, 'client finished'); // clean close
        this.streams.delete(stream);
        console.log(`[HubSDK] Connection closed (delayed) and removed for stream: ${stream}`);
      }, 5_000); // 5‑second grace period
    }
  }
}

export const hubSdk = new HubSocketManager()
