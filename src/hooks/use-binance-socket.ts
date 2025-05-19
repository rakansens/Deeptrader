"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface UseBinanceSocketOptions<T = unknown> {
  url: string;
  reconnectInterval?: number;
  enabled?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (e: Event) => void;
  onMessage?: (data: T) => void;
}

/**
 * Binance WebSocket 接続を管理するフック
 * @param options - 接続オプション
 * @returns 接続ステータス
 */
export function useBinanceSocket<T = unknown>(options: UseBinanceSocketOptions<T>) {
  const {
    url,
    reconnectInterval = 3000,
    enabled = true,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
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

    setStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      onOpen?.();
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onMessage?.(data);
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      onClose?.();
      if (mountedRef.current && reconnectInterval > 0) {
        reconnectRef.current = setTimeout(connect, reconnectInterval);
      }
    };

    ws.onerror = (e) => {
      setStatus("disconnected");
      onError?.(e);
      ws.close();
    };
  }, [url, reconnectInterval, enabled, onOpen, onClose, onError, onMessage]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      connect();
    }
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect, enabled]);

  return { status };
}

export default useBinanceSocket;
