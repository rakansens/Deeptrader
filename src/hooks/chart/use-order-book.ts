"use client";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useBinanceSocket from "./use-binance-socket";
import { fetchOrderBook } from "@/infrastructure/exchange/binance-service";
import { NEXT_PUBLIC_BINANCE_WS_BASE_URL } from "@/lib/env";
import type { OrderBookEntry, BinanceDepthMessage } from "@/types";

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

  const { status } = useBinanceSocket<BinanceDepthMessage>({
    url: `${NEXT_PUBLIC_BINANCE_WS_BASE_URL}/ws/${symbol.toLowerCase()}@depth`,
    onMessage: handleMessage,
    pingInterval: 0,
  });

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

