"use client";
import { useCallback, useEffect, useState } from "react";
import useBinanceSocket from "./use-binance-socket";
import { fetchOrderBook } from "@/infrastructure/exchange/binance-service";
import type { OrderBookEntry } from "@/types";

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

  const loadSnapshot = useCallback(async () => {
    try {
      const data = await fetchOrderBook(symbol, depth);
      setBids(data.bids);
      setAsks(data.asks);
    } catch {
      /* ignore */
    }
  }, [symbol, depth]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const handleMessage = useCallback(
    (msg: { b?: [string, string][]; a?: [string, string][] }) => {
      if (msg.b) {
        const u = msg.b.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }));
        setBids((prev) => updateLevels(prev, u, true, depth));
      }
      if (msg.a) {
        const u = msg.a.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }));
        setAsks((prev) => updateLevels(prev, u, false, depth));
      }
    },
    [depth],
  );

  const { status } = useBinanceSocket({
    url: `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth`,
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (status === "disconnected") {
      loadSnapshot();
    }
  }, [status, loadSnapshot]);

  return { bids, asks, connected: status === "connected" };
}

export default useOrderBook;

