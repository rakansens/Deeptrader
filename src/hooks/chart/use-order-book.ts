"use client";
/**
 * 🔄 2025-05-22: REST での板スナップショット取得を廃止し、
 * Partial Book Depth ストリーム(@depth{depth}@100ms) による
 * スナップショット＋増分更新のみで板情報を維持するよう改修。
 * これによりページリロードや銘柄切替時に発生していた
 * 空白表示・遅延を解消し、常時リアルタイム表示を実現。
 * 
 * 🔄 最新の更新: Hubサーバーを使わず、Binanceに直接接続するように変更
 */
import { useCallback, useEffect, useState, useRef } from "react";
import { NEXT_PUBLIC_BINANCE_WS_BASE_URL } from "@/lib/env";
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
  const wsRef = useRef<WebSocket | null>(null);
  const rafId = useRef<number | null>(null);

  const handleMessage = useCallback(
    (raw: any) => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }

      // デバッグ追加: 受信したデータをログ出力
      console.log(`OrderBook WebSocket received message for ${symbol}:`, raw);

      rafId.current = requestAnimationFrame(() => {
        let data;
        if (typeof raw === 'string') {
          try {
            data = JSON.parse(raw);
          } catch (e) {
            console.error('Failed to parse WebSocket message', e);
            return;
          }
        } else {
          data = raw;
        }

        // Binanceからの直接データの場合はstream情報が含まれている可能性がある
        const msg = (data.data || data) as BinanceDepthMessage & {
          bids?: [string, string][];
          asks?: [string, string][];
        };

        // デバッグ: データの形式と内容を確認
        console.log('OrderBook message structure:', {
          hasBids: !!msg.bids,
          hasAsks: !!msg.asks,
          hasB: !!msg.b,
          hasA: !!msg.a,
          eventType: msg.e,
        });

        // Snapshot メッセージ (bids/asks) --- Partial Book Depth
        if (msg.bids && msg.asks) {
          const snapBids = msg.bids.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }));
          const snapAsks = msg.asks.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }));
          console.log('Setting snapshot data:', { bidsCount: snapBids.length, asksCount: snapAsks.length });
          setBids(snapBids);
          setAsks(snapAsks);
          return;
        }

        // 増分メッセージ (従来の depthUpdate)
        if (msg.b) {
          const u = msg.b.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }));
          console.log('Updating bids with incremental data:', { count: u.length });
          setBids(prev => updateLevels(prev, u, true, depth));
        }
        if (msg.a) {
          const u = msg.a.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }));
          console.log('Updating asks with incremental data:', { count: u.length });
          setAsks(prev => updateLevels(prev, u, false, depth));
        }
      });
    },
    [depth, symbol],
  );

  useEffect(() => {
    // Binanceに直接接続
    const streamName = `${symbol.toLowerCase()}@depth${depth}@100ms`;
    const wsUrl = `${NEXT_PUBLIC_BINANCE_WS_BASE_URL}/stream?streams=${streamName}`;
    console.log(`Connecting directly to Binance WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const open = () => {
      console.log(`OrderBook WebSocket connected for ${symbol}`);
      setStatus("connected");
    };
    
    const close = () => {
      console.log(`OrderBook WebSocket disconnected for ${symbol}`);
      setStatus("disconnected");
    };
    
    const error = (e: Event) => {
      console.error(`OrderBook WebSocket error for ${symbol}:`, e);
      setStatus("disconnected");
    };

    const message = (e: MessageEvent) => {
      handleMessage(e.data);
    };

    ws.addEventListener("open", open);
    ws.addEventListener("close", close);
    ws.addEventListener("error", error);
    ws.addEventListener("message", message);
    
    // 初期状態をログに出力
    console.log(`Initial WebSocket readyState for ${symbol}: ${ws.readyState}`);
    setStatus(ws.readyState === WebSocket.OPEN ? "connected" : "connecting");

    return () => {
      console.log(`Cleaning up OrderBook WebSocket for ${symbol}`);
      ws.removeEventListener("open", open);
      ws.removeEventListener("close", close);
      ws.removeEventListener("error", error);
      ws.removeEventListener("message", message);
      
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [symbol, depth, handleMessage]);

  return { bids, asks, connected: status === "connected" };
}

export default useOrderBook;
