import { useEffect, useRef, useState } from "react";
import {
  CandlestickData,
  HistogramData,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";
import {
  computeSMA,
  computeRSI,
  computeMACD,
  computeBollinger,
} from "@/lib/indicators";

export interface UseCandlestickDataResult {
  candles: CandlestickData[];
  volumes: HistogramData[];
  ma: LineData[];
  rsi: LineData[];
  macd: LineData[];
  signal: LineData[];
  bollUpper: LineData[];
  bollLower: LineData[];
  loading: boolean;
  error: string | null;
}

/**
 * ローソク足データを取得しローカルストレージへ保存するフック
 * @param symbol - 取得する通貨ペア
 * @param interval - 時間枠
 * @returns 各種データと状態
 */
export interface UseCandlestickDataOptions {
  enabled?: boolean;
}

export function useCandlestickData(
  symbol: string,
  interval: string,
  options: UseCandlestickDataOptions = {},
): UseCandlestickDataResult {
  const { enabled = true } = options;
  const [candles, setCandles] = useState<CandlestickData[]>(() => {
    try {
      const stored = localStorage.getItem(`candles_${symbol}_${interval}`);
      return stored ? (JSON.parse(stored) as CandlestickData[]) : [];
    } catch {
      return [];
    }
  });
  const [volumes, setVolumes] = useState<HistogramData[]>(() => {
    try {
      const stored = localStorage.getItem(`volumes_${symbol}_${interval}`);
      return stored ? (JSON.parse(stored) as HistogramData[]) : [];
    } catch {
      return [];
    }
  });
  const [ma, setMa] = useState<LineData[]>([]);
  const [rsi, setRsi] = useState<LineData[]>([]);
  const [macd, setMacd] = useState<LineData[]>([]);
  const [signal, setSignal] = useState<LineData[]>([]);
  const [bollUpper, setBollUpper] = useState<LineData[]>([]);
  const [bollLower, setBollLower] = useState<LineData[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const pricesRef = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let ws: WebSocket | null = null;
    const controller = new AbortController();

    setLoading(true);
    setError(null);
    pricesRef.current = [];
    setMa([]);
    setRsi([]);
    setMacd([]);
    setSignal([]);
    setBollUpper([]);
    setBollLower([]);

    async function load() {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("failed to fetch");
        const raw = (await res.json()) as any[];
        const c: CandlestickData[] = [];
        const v: HistogramData[] = [];
        const maArr: LineData[] = [];
        const rsiArr: LineData[] = [];
        const macdArr: LineData[] = [];
        const sigArr: LineData[] = [];
        const bUp: LineData[] = [];
        const bLow: LineData[] = [];

        raw.forEach((d) => {
          const candle: CandlestickData = {
            time: (d[0] / 1000) as UTCTimestamp,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          };
          c.push(candle);

          const volume: HistogramData = {
            time: (d[0] / 1000) as UTCTimestamp,
            value: parseFloat(d[5]),
            color: parseFloat(d[4]) >= parseFloat(d[1]) ? "#26a69a" : "#ef5350",
          };
          v.push(volume);

          pricesRef.current.push(candle.close);
          const maVal = computeSMA(pricesRef.current, 14);
          if (maVal !== null) maArr.push({ time: candle.time, value: maVal });
          const rsiVal = computeRSI(pricesRef.current, 14);
          if (rsiVal !== null)
            rsiArr.push({ time: candle.time, value: rsiVal });
          const macdVal = computeMACD(pricesRef.current);
          if (macdVal) {
            macdArr.push({ time: candle.time, value: macdVal.macd });
            sigArr.push({ time: candle.time, value: macdVal.signal });
          }
          const bollVal = computeBollinger(pricesRef.current);
          if (bollVal) {
            bUp.push({ time: candle.time, value: bollVal.upper });
            bLow.push({ time: candle.time, value: bollVal.lower });
          }
        });

        setCandles(c);
        setVolumes(v);
        setMa(maArr);
        setRsi(rsiArr);
        setMacd(macdArr);
        setSignal(sigArr);
        setBollUpper(bUp);
        setBollLower(bLow);
        localStorage.setItem(
          `candles_${symbol}_${interval}`,
          JSON.stringify(c),
        );
        localStorage.setItem(
          `volumes_${symbol}_${interval}`,
          JSON.stringify(v),
        );
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError((e as Error).message);
        setLoading(false);
      }
    }

    load();

    ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`,
    );
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      const k = msg.k;
      const candle: CandlestickData = {
        time: (k.t / 1000) as UTCTimestamp,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
      };
      setCandles((prev) => {
        const arr = [...prev, candle];
        if (arr.length > 500) arr.shift();
        localStorage.setItem(
          `candles_${symbol}_${interval}`,
          JSON.stringify(arr),
        );
        return arr;
      });

      const volume: HistogramData = {
        time: (k.t / 1000) as UTCTimestamp,
        value: parseFloat(k.v),
        color: parseFloat(k.c) >= parseFloat(k.o) ? "#26a69a" : "#ef5350",
      };
      setVolumes((prev) => {
        const arr = [...prev, volume];
        if (arr.length > 500) arr.shift();
        localStorage.setItem(
          `volumes_${symbol}_${interval}`,
          JSON.stringify(arr),
        );
        return arr;
      });

      pricesRef.current.push(candle.close);
      if (pricesRef.current.length > 1000) pricesRef.current.shift();
      const maVal = computeSMA(pricesRef.current, 14);
      if (maVal !== null)
        setMa((prev) => [...prev, { time: candle.time, value: maVal }]);
      const rsiVal = computeRSI(pricesRef.current, 14);
      if (rsiVal !== null)
        setRsi((prev) => [...prev, { time: candle.time, value: rsiVal }]);
      const macdVal = computeMACD(pricesRef.current);
      if (macdVal) {
        setMacd((prev) => [
          ...prev,
          { time: candle.time, value: macdVal.macd },
        ]);
        setSignal((prev) => [
          ...prev,
          { time: candle.time, value: macdVal.signal },
        ]);
      }
      const bollVal = computeBollinger(pricesRef.current);
      if (bollVal) {
        setBollUpper((prev) => [
          ...prev,
          { time: candle.time, value: bollVal.upper },
        ]);
        setBollLower((prev) => [
          ...prev,
          { time: candle.time, value: bollVal.lower },
        ]);
      }
    };

    return () => {
      controller.abort();
      ws?.close();
      pricesRef.current = [];
    };
  }, [symbol, interval, enabled]);

  return {
    candles,
    volumes,
    ma,
    rsi,
    macd,
    signal,
    bollUpper,
    bollLower,
    loading,
    error,
  };
}

export default useCandlestickData;
