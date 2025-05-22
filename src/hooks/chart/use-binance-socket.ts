"use client";

import { useEffect, useState } from "react";
import { hubSdk, type Listener } from "@/lib/hub-sdk";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface UseBinanceSocketOptions<T> {
  url: string;
  enabled?: boolean;
  onMessage?: (data: T) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (e: Event) => void;
}

function extractStream(url: string): string {
  const i = url.lastIndexOf("/");
  return url.slice(i + 1);
}

export function useBinanceSocket<T>(options: UseBinanceSocketOptions<T>) {
  const { url, enabled = true, onMessage, onOpen, onClose, onError } = options;
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    if (!enabled) {
      setStatus("disconnected");
      return;
    }
    const stream = extractStream(url);
    const { ws, unsubscribe } = hubSdk.subscribe(stream, (d) => {
      onMessage?.(d as T);
    });
    const handleOpen = () => {
      setStatus("connected");
      onOpen?.();
    };
    const handleClose = (e?: Event) => {
      setStatus("disconnected");
      if (e?.type === "error") onError?.(e as Event);
      else onClose?.();
    };
    setStatus(ws.readyState === WebSocket.OPEN ? "connected" : "connecting");
    ws.addEventListener("open", handleOpen);
    ws.addEventListener("close", handleClose);
    ws.addEventListener("error", handleClose);
    return () => {
      ws.removeEventListener("open", handleOpen);
      ws.removeEventListener("close", handleClose);
      ws.removeEventListener("error", handleClose);
      unsubscribe();
    };
  }, [url, enabled, onMessage, onOpen, onClose, onError]);

  return { status };
}

export default useBinanceSocket;

