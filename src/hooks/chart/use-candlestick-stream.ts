import { useCallback, useEffect, useRef, useState } from "react";
import {
  CandlestickData,
  HistogramData,
  UTCTimestamp,
} from "lightweight-charts";
import { safeLoadJson, safeSaveJson } from "@/lib/utils";
import { upsertSeries } from "@/lib/chart";
import { hubSdk } from "@/lib/hub-sdk";
import type { BinanceKline, BinanceKlineMessage } from "@/types";
import type { Timeframe, SymbolValue } from "@/constants/chart";
import type { ConnectionStatus } from "./use-binance-socket";

export interface UseCandlestickStreamResult {
  candles: CandlestickData<UTCTimestamp>[];
  volumes: HistogramData<UTCTimestamp>[];
  loading: boolean;
  error: string | null;
  connected: boolean;
}

export function useCandlestickStream(
  symbol: SymbolValue,
  interval: Timeframe,
): UseCandlestickStreamResult {
  const [candles, setCandles] = useState<CandlestickData<UTCTimestamp>[]>(() => {
    const stored = safeLoadJson<CandlestickData<UTCTimestamp>[]>(
      `candles_${symbol}_${interval}`,
      "cached candles",
    );
    if (
      Array.isArray(stored) &&
      (stored.length === 0 || (stored[0] && typeof stored[0].time === "number"))
    ) {
      return stored as CandlestickData<UTCTimestamp>[];
    }
    return [];
  });
  const [volumes, setVolumes] = useState<HistogramData<UTCTimestamp>[]>(() => {
    const stored = safeLoadJson<HistogramData<UTCTimestamp>[]>(
      `volumes_${symbol}_${interval}`,
      "cached volumes",
    );
    if (
      Array.isArray(stored) &&
      (stored.length === 0 || (stored[0] && typeof stored[0].time === "number"))
    ) {
      return stored as HistogramData<UTCTimestamp>[];
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    const c = safeLoadJson<CandlestickData<UTCTimestamp>[]>(
      `candles_${symbol}_${interval}`,
      "cached candles",
    );
    const v = safeLoadJson<HistogramData<UTCTimestamp>[]>(
      `volumes_${symbol}_${interval}`,
      "cached volumes",
    );
    setCandles(
      Array.isArray(c) &&
        (c.length === 0 || (c[0] && typeof c[0].time === "number"))
        ? (c as CandlestickData<UTCTimestamp>[])
        : [],
    );
    setVolumes(
      Array.isArray(v) &&
        (v.length === 0 || (v[0] && typeof v[0].time === "number"))
        ? (v as HistogramData<UTCTimestamp>[])
        : [],
    );
  }, [symbol, interval]);

  const lastSaveRef = useRef(0);
  const SAVE_INTERVAL = 5000;

  const persist = useCallback(
    (c: CandlestickData<UTCTimestamp>[], v: HistogramData<UTCTimestamp>[], force = false) => {
      const now = Date.now();
      if (force || now - lastSaveRef.current > SAVE_INTERVAL) {
        lastSaveRef.current = now;
        safeSaveJson(`candles_${symbol}_${interval}`, c, "candles");
        safeSaveJson(`volumes_${symbol}_${interval}`, v, "volumes");
      }
    },
    [symbol, interval],
  );

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const raw = (await res.json()) as BinanceKline[];
        const cs: CandlestickData<UTCTimestamp>[] = [];
        const vs: HistogramData<UTCTimestamp>[] = [];
        raw.forEach((d) => {
          const [openTime, open, high, low, close, vol] = d;
          const time = (openTime / 1000) as UTCTimestamp;
          cs.push({
            time,
            open: parseFloat(open),
            high: parseFloat(high),
            low: parseFloat(low),
            close: parseFloat(close),
          });
          vs.push({
            time,
            value: parseFloat(vol),
            color: parseFloat(close) >= parseFloat(open) ? "#26a69a" : "#ef5350",
          });
        });
        if (!controller.signal.aborted) {
          setCandles(cs);
          setVolumes(vs);
          persist(cs, vs, true);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError((e as Error).message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [symbol, interval, persist]);

  const handleMessage = useCallback(
    (msg: BinanceKlineMessage) => {
      if (!msg.k) return;
      const k = msg.k;
      const time = (k.t / 1000) as UTCTimestamp;
      const candle: CandlestickData<UTCTimestamp> = {
        time,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
      };
      setCandles((prev) => {
        const updated = upsertSeries(prev, candle, 500);
        persist(updated, volumes);
        return updated;
      });
      setVolumes((prev) => {
        const volume: HistogramData<UTCTimestamp> = {
          time,
          value: parseFloat(k.v),
          color: parseFloat(k.c) >= parseFloat(k.o) ? "#26a69a" : "#ef5350",
        };
        const updated = upsertSeries(prev, volume, 500);
        persist(candles, updated);
        return updated;
      });
    },
    [candles, volumes, persist],
  );

  useEffect(() => {
    let unsub: (() => void) | null = null;
    setStatus("connecting");
    const timer = setTimeout(() => {
      // OrderBook hook now handles depth updates; subscribe only to kline here
      const streamKey = `${symbol.toLowerCase()}@kline_${interval}`;
      const sub = hubSdk.subscribe(streamKey, (m) => {
        const data = (m as any).data ?? m;
        handleMessage(data as BinanceKlineMessage);
      });
      unsub = sub.unsubscribe;
      const ws = sub.ws;
      const open = () => setStatus("connected");
      const close = () => setStatus("disconnected");
      ws.addEventListener("open", open);
      ws.addEventListener("close", close);
      ws.addEventListener("error", close);
      if (ws.readyState === WebSocket.OPEN) setStatus("connected");
    }, 300);
    return () => {
      clearTimeout(timer);
      if (unsub) unsub();
    };
  }, [symbol, interval, handleMessage]);

  return { candles, volumes, loading, error, connected: status === "connected" };
}

export default useCandlestickStream;

