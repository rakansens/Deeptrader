"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface UseBinanceSocketOptions<T> {
  url: string
  reconnectInterval?: number
  pingInterval?: number
  maxReconnectAttempts?: number
  enabled?: boolean
  onOpen?: () => void
  onClose?: () => void
  onError?: (e: Event) => void
  onMessage?: (data: T) => void
}

const DEFAULT_PING_INTERVAL = 3 * 60 * 1000
const PONG_TIMEOUT = 10 * 1000

/**
 * Binance WebSocket 接続を管理するフック
 * @param options - 接続オプション
 * @returns 接続ステータス
 */
export function useBinanceSocket<T = unknown>(options: UseBinanceSocketOptions<T>) {
  const {
    url,
    reconnectInterval = 3000,
    pingInterval = DEFAULT_PING_INTERVAL,
    maxReconnectAttempts = 5,
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
  const reconnectAttemptsRef = useRef(0);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  const cleanupResources = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return;

    // 既存の接続をクリーンアップ
    if (wsRef.current && wsRef.current.readyState !== 3) { // 3 = WebSocket.CLOSED
      wsRef.current.close();
    }
    
    cleanupResources();

    // 再接続試行回数の確認
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      logger.warn(`最大再接続試行回数(${maxReconnectAttempts})に達しました。接続を中止します。`);
      reconnectAttemptsRef.current = 0;
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        reconnectAttemptsRef.current = 0; // 接続成功時にカウンターをリセット
        onOpen?.();
        if (pingInterval > 0) {
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === 1) { // 1 = WebSocket.OPEN
              pingIdRef.current += 1;
              try {
                ws.send(
                  JSON.stringify({ method: "PING", id: pingIdRef.current })
                );
                pongTimeoutRef.current = setTimeout(() => {
                  if (ws.readyState === 1) { // 1 = WebSocket.OPEN
                    cleanupResources();
                    ws.close();
                  }
                }, PONG_TIMEOUT);
              } catch (e) {
                logger.error("Failed to send ping", e);
                if (pongTimeoutRef.current) {
                  clearTimeout(pongTimeoutRef.current);
                  pongTimeoutRef.current = null;
                }
                cleanupResources();
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                  ws.close();
                }
              }
            }
          }, pingInterval);
        }
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.result === null && typeof data.id === "number") {
            if (data.id === pingIdRef.current && pongTimeoutRef.current) {
              clearTimeout(pongTimeoutRef.current);
              pongTimeoutRef.current = null;
            }
            return;
          }
          onMessage?.(data);
        } catch (e) {
          logger.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        onClose?.();
        cleanupResources();
        
        if (mountedRef.current && reconnectInterval > 0) {
          reconnectAttemptsRef.current += 1;
          logger.info(`WebSocket接続が閉じられました。${reconnectInterval}ms後に再接続を試みます。(試行回数: ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          reconnectRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      ws.onerror = (e) => {
        logger.error("WebSocket接続エラー", e);
        setStatus("disconnected");
        onError?.(e);
        if (ws.readyState !== 3) { // 3 = WebSocket.CLOSED
          ws.close();
        }
      };
    } catch (error) {
      logger.error("WebSocket初期化エラー", error);
      setStatus("disconnected");
      if (mountedRef.current && reconnectInterval > 0) {
        reconnectAttemptsRef.current += 1;
        reconnectRef.current = setTimeout(connect, reconnectInterval);
      }
    }
  }, [url, reconnectInterval, pingInterval, maxReconnectAttempts, enabled, onOpen, onClose, onError, onMessage, cleanupResources]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      connect();
    }
    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          logger.error("WebSocketクローズエラー", e);
        }
      }
      cleanupResources();
    };
  }, [connect, enabled, cleanupResources]);

  return { status };
}

export default useBinanceSocket;

