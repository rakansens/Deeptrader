"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOrderBook } from "@/infrastructure/exchange/binance-service";
import { socketHub } from "@/lib/binance-socket-manager";
import type { OrderBookEntry, BinanceDepthMessage } from "@/types";
import type { ConnectionStatus } from "./use-binance-socket";

export interface UseOrderBookResult {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  connected: boolean;
}

function updateLevels(
  current: OrderBookEntry[],
  updates: OrderBookEntry[],
  isBid: boolean,
  depth: number,
): OrderBookEntry[] {
  const map = new Map<number, number>();
  current.forEach((o) => map.set(o.price, o.quantity));
  updates.forEach((u) => {
    if (u.quantity === 0) map.delete(u.price);
    else map.set(u.price, u.quantity);
  });
  const arr = Array.from(map.entries()).map(([price, quantity]) => ({ price, quantity }));
  arr.sort((a, b) => (isBid ? b.price - a.price : a.price - b.price));
  return arr.slice(0, depth);
}

export function useOrderBook(symbol: string, depth = 20): UseOrderBookResult {
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const rafId = useRef<number | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["orderBook", symbol, depth],
    queryFn: () => fetchOrderBook(symbol, depth),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      setBids(data.bids);
      setAsks(data.asks);
    }
  }, [data]);

  const handleMessage = useCallback(
    (msg: BinanceDepthMessage) => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      rafId.current = requestAnimationFrame(() => {
        if (msg.b) {
          const u = msg.b.map(([p, q]) => ({
            price: parseFloat(p),
            quantity: parseFloat(q),
          }));
          setBids((prev) => updateLevels(prev, u, true, depth));
        }
        if (msg.a) {
          const u = msg.a.map(([p, q]) => ({
            price: parseFloat(p),
            quantity: parseFloat(q),
          }));
          setAsks((prev) => updateLevels(prev, u, false, depth));
        }
      });
    },
    [depth],
  );

  useEffect(() => {
    const { ws, unsubscribe } = socketHub.subscribe(
      `${symbol.toLowerCase()}@depth`,
      (msg) => {
        const payload = (msg as any).data ?? msg;
        handleMessage(payload as BinanceDepthMessage);
      },
    );
    const open = () => setStatus("connected");
    const close = () => setStatus("disconnected");
    ws.addEventListener("open", open);
    ws.addEventListener("close", close);
    ws.addEventListener("error", close);
    setStatus(ws.readyState === WebSocket.OPEN ? "connected" : "connecting");
    return () => {
      ws.removeEventListener("open", open);
      ws.removeEventListener("close", close);
      ws.removeEventListener("error", close);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      unsubscribe();
    };
  }, [symbol, handleMessage]);

  useEffect(() => {
    if (status === "disconnected") {
      refetch().catch(() => {
        /* ignore */
      });
    }
  }, [status, refetch]);

  return { bids, asks, connected: status === "connected" };
}

export default useOrderBook;
