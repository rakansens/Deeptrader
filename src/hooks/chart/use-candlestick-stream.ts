import { useCallback, useEffect, useRef, useState } from "react";
import {
  CandlestickData,
  HistogramData,
  UTCTimestamp,
} from "lightweight-charts";
import useBinanceSocket from "./use-binance-socket";
import { safeLoadJson, safeSaveJson } from "@/lib/utils";
import { upsertSeries } from "@/lib/candlestick-utils";
import type { BinanceKline, BinanceKlineMessage } from "@/types";
import type { Timeframe, SymbolValue } from "@/constants/chart";

export interface UseCandlestickStreamResult {
  candles: CandlestickData<UTCTimestamp>[];
  volumes: HistogramData<UTCTimestamp>[];
  loading: boolean;
  error: string | null;
  connected: boolean;
}

/**
 * ローソク足データの取得とWebSocket更新を管理するフック
 * @param symbol - 通貨ペア
 * @param interval - 時間枠
 */
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

  const lastSaveRef = useRef(0);
  const SAVE_INTERVAL = 5000; // 5秒おきに保存

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

  // 初期データ取得
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

  // WebSocketメッセージ処理
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

  const { status } = useBinanceSocket<BinanceKlineMessage>({
    url: `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`,
    onMessage: handleMessage,
    enabled: !loading && !error,
    pingInterval: 0,
  });

  return { candles, volumes, loading, error, connected: status === "connected" };
}

export default useCandlestickStream;

