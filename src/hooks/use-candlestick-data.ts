import { useCallback, useEffect, useRef, useState } from "react";
import {
  CandlestickData,
  HistogramData,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";
import type { BinanceKline, BinanceKlineMessage } from "@/types";
import useBinanceSocket from "./use-binance-socket";
import { calculateIndicators, upsertSeries } from "@/lib/candlestick-utils";
import type { Timeframe, SymbolValue } from "@/constants/chart";

export interface UseCandlestickDataResult {
  candles: CandlestickData<UTCTimestamp>[];
  volumes: HistogramData<UTCTimestamp>[];
  ma: LineData<UTCTimestamp>[];
  rsi: LineData<UTCTimestamp>[];
  macd: LineData<UTCTimestamp>[];
  signal: LineData<UTCTimestamp>[];
  histogram: LineData<UTCTimestamp>[];
  bollUpper: LineData<UTCTimestamp>[];
  bollLower: LineData<UTCTimestamp>[];
  loading: boolean;
  error: string | null;
  connected: boolean;
}

/**
 * ローソク足データを取得するフック
 * @param symbol - 通貨ペア
 * @param interval - 時間枠
 */
export function useCandlestickData(
  symbol: SymbolValue,
  interval: Timeframe,
): UseCandlestickDataResult {
  const [candles, setCandles] = useState<CandlestickData<UTCTimestamp>[]>(() => {
    try {
      const stored = localStorage.getItem(`candles_${symbol}_${interval}`);
      return stored ? (JSON.parse(stored) as CandlestickData<UTCTimestamp>[]) : [];
    } catch {
      return [];
    }
  });
  const [volumes, setVolumes] = useState<HistogramData<UTCTimestamp>[]>(() => {
    try {
      const stored = localStorage.getItem(`volumes_${symbol}_${interval}`);
      return stored ? (JSON.parse(stored) as HistogramData<UTCTimestamp>[]) : [];
    } catch {
      return [];
    }
  });
  const [ma, setMa] = useState<LineData<UTCTimestamp>[]>([]);
  const [rsi, setRsi] = useState<LineData<UTCTimestamp>[]>([]);
  const [macd, setMacd] = useState<LineData<UTCTimestamp>[]>([]);
  const [signal, setSignal] = useState<LineData<UTCTimestamp>[]>([]);
  const [histogram, setHistogram] = useState<LineData<UTCTimestamp>[]>([]);
  const [bollUpper, setBollUpper] = useState<LineData<UTCTimestamp>[]>([]);
  const [bollLower, setBollLower] = useState<LineData<UTCTimestamp>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pricesRef = useRef<number[]>([]);

  // 初期データ取得
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      pricesRef.current = [];
      setMa([]);
      setRsi([]);
      setMacd([]);
      setSignal([]);
      setHistogram([]);
      setBollUpper([]);
      setBollLower([]);
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok)
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        const raw = (await res.json()) as BinanceKline[];
        const c: CandlestickData<UTCTimestamp>[] = [];
        const v: HistogramData<UTCTimestamp>[] = [];
        const maArr: LineData<UTCTimestamp>[] = [];
        const rsiArr: LineData<UTCTimestamp>[] = [];
        const macdArr: LineData<UTCTimestamp>[] = [];
        const sigArr: LineData<UTCTimestamp>[] = [];
        const histArr: LineData<UTCTimestamp>[] = [];
        const bUp: LineData<UTCTimestamp>[] = [];
        const bLow: LineData<UTCTimestamp>[] = [];
        raw.forEach((d) => {
          const [openTime, open, high, low, close, vol] = d;
          const time = (openTime / 1000) as UTCTimestamp;
          const candle: CandlestickData<UTCTimestamp> = {
            time,
            open: parseFloat(open),
            high: parseFloat(high),
            low: parseFloat(low),
            close: parseFloat(close),
          };
          c.push(candle);
          const volume: HistogramData<UTCTimestamp> = {
            time,
            value: parseFloat(vol),
            color:
              parseFloat(close) >= parseFloat(open) ? "#26a69a" : "#ef5350",
          };
          v.push(volume);
          pricesRef.current.push(candle.close);
          const ind = calculateIndicators(pricesRef.current, time);
          if (ind.ma) maArr.push(ind.ma as LineData<UTCTimestamp>);
          if (ind.rsi) rsiArr.push(ind.rsi as LineData<UTCTimestamp>);
          if (ind.macd) macdArr.push(ind.macd as LineData<UTCTimestamp>);
          if (ind.signal) sigArr.push(ind.signal as LineData<UTCTimestamp>);
          if (ind.histogram) histArr.push(ind.histogram as LineData<UTCTimestamp>);
          if (ind.bollUpper) bUp.push(ind.bollUpper as LineData<UTCTimestamp>);
          if (ind.bollLower) bLow.push(ind.bollLower as LineData<UTCTimestamp>);
        });
        if (!controller.signal.aborted) {
          setCandles(c);
          setVolumes(v);
          setMa(maArr);
          setRsi(rsiArr);
          setMacd(macdArr);
          setSignal(sigArr);
          setHistogram(histArr);
          setBollUpper(bUp);
          setBollLower(bLow);
          try {
            localStorage.setItem(
              `candles_${symbol}_${interval}`,
              JSON.stringify(c),
            );
            localStorage.setItem(
              `volumes_${symbol}_${interval}`,
              JSON.stringify(v),
            );
          } catch {
            /* ignore */
          }
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
  }, [symbol, interval]);

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
        const updatedCandles = upsertSeries(prev, candle, 500);
        try {
          localStorage.setItem(
            `candles_${symbol}_${interval}`,
            JSON.stringify(updatedCandles),
          );
        } catch {
          /* ignore */
        }
        return updatedCandles;
      });
      const volume: HistogramData<UTCTimestamp> = {
        time,
        value: parseFloat(k.v),
        color: parseFloat(k.c) >= parseFloat(k.o) ? "#26a69a" : "#ef5350",
      };
      setVolumes((prev) => {
        const updatedVolumes = upsertSeries(prev, volume, 500);
        try {
          localStorage.setItem(
            `volumes_${symbol}_${interval}`,
            JSON.stringify(updatedVolumes),
          );
        } catch {
          /* ignore */
        }
        return updatedVolumes;
      });
      pricesRef.current.push(candle.close);
      if (pricesRef.current.length > 1000) pricesRef.current.shift();
      const ind = calculateIndicators(pricesRef.current, time);
      if (ind.ma) {
        setMa((prev) => upsertSeries(prev, ind.ma as LineData<UTCTimestamp>, 500));
      }
      if (ind.rsi) {
        setRsi((prev) => upsertSeries(prev, ind.rsi as LineData<UTCTimestamp>, 500));
      }
      if (ind.macd) {
        setMacd((prev) => upsertSeries(prev, ind.macd as LineData<UTCTimestamp>, 500));
      }
      if (ind.signal) {
        setSignal((prev) => upsertSeries(prev, ind.signal as LineData<UTCTimestamp>, 500));
      }
      if (ind.histogram) {
        setHistogram((prev) => upsertSeries(prev, ind.histogram as LineData<UTCTimestamp>, 500));
      }
      if (ind.bollUpper) {
        setBollUpper((prev) =>
          upsertSeries(prev, ind.bollUpper as LineData<UTCTimestamp>, 500)
        );
      }
      if (ind.bollLower) {
        setBollLower((prev) => 
          upsertSeries(prev, ind.bollLower as LineData<UTCTimestamp>, 500)
        );
      }
    },
    [symbol, interval],
  );

  const { status } = useBinanceSocket<BinanceKlineMessage>({
    url: `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`,
    onMessage: handleMessage,
    enabled: !loading && !error,
  });

  return {
    candles,
    volumes,
    ma,
    rsi,
    macd,
    signal,
    histogram,
    bollUpper,
    bollLower,
    loading,
    error,
    connected: status === "connected",
  };
}

export default useCandlestickData;
