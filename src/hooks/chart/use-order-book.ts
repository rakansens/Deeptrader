"use client";
/**
 * 🔄 2025-05-22: REST での板スナップショット取得を廃止し、
 * Partial Book Depth ストリーム(@depth{depth}@100ms) による
 * スナップショット＋増分更新のみで板情報を維持するよう改修。
 * これによりページリロードや銘柄切替時に発生していた
 * 空白表示・遅延を解消し、常時リアルタイム表示を実現。
 */
import { useCallback, useEffect, useState, useRef } from "react";
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

  const handleMessage = useCallback(
    (raw: any) => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        const msg = raw as BinanceDepthMessage & {
          bids?: [string, string][];
          asks?: [string, string][];
        };

        // Snapshot メッセージ (bids/asks) --- Partial Book Depth
        if (msg.bids && msg.asks) {
          const snapBids = msg.bids.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }));
          const snapAsks = msg.asks.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }));
          setBids(snapBids);
          setAsks(snapAsks);
          return;
        }

        // 増分メッセージ (従来の depthUpdate)
        if (msg.b) {
          const u = msg.b.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }));
          setBids(prev => updateLevels(prev, u, true, depth));
        }
        if (msg.a) {
          const u = msg.a.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }));
          setAsks(prev => updateLevels(prev, u, false, depth));
        }
      });
    },
    [depth],
  );

  useEffect(() => {
    const streamName = `${symbol.toLowerCase()}@depth${depth}@100ms`;

    const { ws, unsubscribe } = socketHub.subscribe(streamName, (msg) => {
      const payload = (msg as any).data ?? msg;
      handleMessage(payload);
    });

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
  }, [symbol, depth, handleMessage]);

  return { bids, asks, connected: status === "connected" };
}

export default useOrderBook;
