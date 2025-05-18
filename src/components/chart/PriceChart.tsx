"use client";

import {
  createChart,
  UTCTimestamp,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import { useEffect, useRef, useState, useCallback } from "react";
import useBinanceSocket from "@/hooks/use-binance-socket";
import { Card, CardContent } from "@/components/ui/card";
import { computeSMA, computeRSI, computeMACD } from "@/lib/indicators";

export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const priceData = useRef<number[]>([]);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const maSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const { status: connectionStatus } = useBinanceSocket({
    url: "wss://stream.binance.com:9443/ws/btcusdt@trade",
    onMessage: useCallback((msg: any) => {
      const price = parseFloat(msg.p);
      const time = Math.floor(msg.T / 1000) as UTCTimestamp;

      if (
        priceSeriesRef.current &&
        maSeriesRef.current &&
        rsiSeriesRef.current &&
        macdSeriesRef.current
      ) {
        priceSeriesRef.current.update({ time, value: price });
        setLastPrice(price);

        priceData.current.push(price);
        if (priceData.current.length > 500) priceData.current.shift();

        if (priceData.current.length > 1) {
          const startPrice = priceData.current[0];
          const changePercent = ((price - startPrice) / startPrice) * 100;
          setPriceChange(changePercent);
        }

        const ma = computeSMA(priceData.current, 14);
        if (ma !== null) maSeriesRef.current.update({ time, value: ma });

        const rsi = computeRSI(priceData.current, 14);
        if (rsi !== null) rsiSeriesRef.current.update({ time, value: rsi });

        const macd = computeMACD(priceData.current);
        if (macd !== null)
          macdSeriesRef.current.update({ time, value: macd.histogram });
      }
    }, []),
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Calculate proper dimensions
    const width = containerRef.current.clientWidth;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(100, 100, 100, 0.9)",
      },
      grid: {
        vertLines: { color: "rgba(42, 46, 57, 0.2)" },
        horzLines: { color: "rgba(42, 46, 57, 0.2)" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: "rgba(42, 46, 57, 0.3)",
      },
      rightPriceScale: {
        borderColor: "rgba(42, 46, 57, 0.3)",
      },
      width,
      height: 380,
    });

    chartRef.current = chart;

    const priceSeries = chart.addLineSeries({
      color: "#22c55e",
      lineWidth: 2,
      priceLineVisible: true,
    });
    priceSeriesRef.current = priceSeries;

    const maSeries = chart.addLineSeries({
      color: "#f59e0b",
      lineWidth: 2,
      priceLineVisible: false,
    });
    maSeriesRef.current = maSeries;

    const rsiSeries = chart.addLineSeries({
      color: "#3b82f6",
      lineWidth: 1,
      priceScaleId: "right",
      priceLineVisible: false,
    });
    rsiSeriesRef.current = rsiSeries;

    const macdSeries = chart.addLineSeries({
      color: "#10b981",
      lineWidth: 1,
      priceScaleId: "right",
      priceLineVisible: false,
    });
    macdSeriesRef.current = macdSeries;

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(containerRef.current.clientWidth, 380);
      }
    };

    // Add event listeners
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      // クリーンアップ処理

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      // シリーズ参照をクリア
      priceSeriesRef.current = null;
      maSeriesRef.current = null;
      rsiSeriesRef.current = null;
      macdSeriesRef.current = null;
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center">
            <span className="text-lg font-bold">BTC/USDT</span>
            <span
              className={`ml-2 text-sm ${priceChange >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {priceChange >= 0 ? "+" : ""}
              {priceChange.toFixed(2)}%
            </span>
            <span className="ml-2 text-xs">
              {connectionStatus === "connected"
                ? "🟢 接続中"
                : connectionStatus === "connecting"
                  ? "🟡 接続中..."
                  : "🔴 未接続"}
            </span>
          </div>
          {lastPrice && (
            <div
              className={`text-2xl font-bold ${priceChange >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              $
              {lastPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          ライブプライスフィード - Binance
        </div>
      </div>
      <div
        ref={containerRef}
        className="w-full rounded-md overflow-hidden mb-2"
      />
      <div className="grid grid-cols-4 gap-2 text-xs mt-2">
        <div className="border rounded-md p-2">
          <div className="text-muted-foreground">14日SMA</div>
          <div className="font-semibold text-amber-500">
            移動平均（オレンジ）
          </div>
        </div>
        <div className="border rounded-md p-2">
          <div className="text-muted-foreground">14日RSI</div>
          <div className="font-semibold text-blue-500">強弱指数（青）</div>
        </div>
        <div className="border rounded-md p-2">
          <div className="text-muted-foreground">MACD</div>
          <div className="font-semibold text-emerald-500">
            ヒストグラム（緑）
          </div>
        </div>
        <div className="border rounded-md p-2">
          <div className="text-muted-foreground">時間スケール</div>
          <div className="font-semibold">リアルタイム</div>
        </div>
      </div>
    </div>
  );
}
