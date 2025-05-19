"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface UseBinanceSocketOptions {
  url: string
  reconnectInterval?: number
  pingInterval?: number
  enabled?: boolean
  onOpen?: () => void
  onClose?: () => void
  onError?: (e: Event) => void
  onMessage?: (data: any) => void
}

const DEFAULT_PING_INTERVAL = 3 * 60 * 1000
const PONG_TIMEOUT = 10 * 1000

/**
 * Binance WebSocket 接続を管理するフック
 * @param options - 接続オプション
 * @returns 接続ステータス
 */
export function useBinanceSocket(options: UseBinanceSocketOptions) {
  const {
    url,
    reconnectInterval = 3000,
    pingInterval = DEFAULT_PING_INTERVAL,
    enabled = true,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIdRef = useRef(0);
  const mountedRef = useRef(false);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return;

    if (wsRef.current) {
      wsRef.current.close();
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current)
      pongTimeoutRef.current = null
    }

    setStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      onOpen?.();
      if (pingInterval > 0) {
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingIdRef.current += 1
            ws.send(
              JSON.stringify({ method: "PING", id: pingIdRef.current })
            )
            pongTimeoutRef.current = setTimeout(() => {
              ws.close()
            }, PONG_TIMEOUT)
          }
        }, pingInterval)
      }
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data.result === null && typeof data.id === "number") {
          if (data.id === pingIdRef.current && pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current)
            pongTimeoutRef.current = null
          }
          return
        }
        onMessage?.(data)
      } catch (e) {
        console.error("Failed to parse websocket message", e)
      }
    }

    ws.onclose = () => {
      setStatus("disconnected")
      onClose?.()
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
      if (pongTimeoutRef.current) {
        clearTimeout(pongTimeoutRef.current)
        pongTimeoutRef.current = null
      }
      if (mountedRef.current && reconnectInterval > 0) {
        reconnectRef.current = setTimeout(connect, reconnectInterval)
      }
    }

    ws.onerror = (e) => {
      setStatus("disconnected")
      onError?.(e)
      ws.close()
    }
  }, [url, reconnectInterval, pingInterval, enabled, onOpen, onClose, onError, onMessage])

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      connect();
    }
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
    };
  }, [connect, enabled]);

  return { status };
}

export default useBinanceSocket;
