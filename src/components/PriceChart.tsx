'use client';

import { createChart, LineData, UTCTimestamp, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Compute simple moving average.
 */
function computeSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Compute RSI indicator.
 */
function computeRSI(data: number[], period: number): number | null {
  if (data.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const priceData = useRef<number[]>([]);
  const chartRef = useRef<IChartApi | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [initTime] = useState(Date.now());

  useEffect(() => {
    if (!containerRef.current) return;
    isMountedRef.current = true;

    // Calculate proper dimensions
    const width = containerRef.current.clientWidth;
    
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(100, 100, 100, 0.9)',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
      },
      timeScale: { 
        timeVisible: true, 
        secondsVisible: true,
        borderColor: 'rgba(42, 46, 57, 0.3)',
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 46, 57, 0.3)',
      },
      width,
      height: 380,
    });
    
    chartRef.current = chart;
    
    const priceSeries = chart.addLineSeries({ 
      color: '#22c55e', 
      lineWidth: 2,
      priceLineVisible: true,
    });
    
    const maSeries = chart.addLineSeries({ 
      color: '#f59e0b', 
      lineWidth: 2,
      priceLineVisible: false,
    });
    
    const rsiSeries = chart.addLineSeries({ 
      color: '#3b82f6', 
      lineWidth: 1.5,
      priceScaleId: 'right',
      priceLineVisible: false,
    });

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(
          containerRef.current.clientWidth,
          380
        );
      }
    };

    /**
     * WebSocket 再接続戦略: 接続が閉じられた場合やエラー発生時に
     * 3 秒後に再接続を試みる。アンマウント時にタイマーを解除し
     * 再接続を停止する。
     */
    const connect = () => {
      if (!isMountedRef.current) return;
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        if (isMountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error', err);
        if (isMountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        const price = parseFloat(msg.p);
        const time = Math.floor(msg.T / 1000) as UTCTimestamp;

        priceSeries.update({ time, value: price });

        // Update state for display
        setLastPrice(price);

        // Store price for indicators
        priceData.current.push(price);
        if (priceData.current.length > 500) priceData.current.shift();

        // Calculate 24h change (simulated)
        if (priceData.current.length > 1) {
          const startPrice = priceData.current[0];
          const endPrice = price;
          const changePercent = ((endPrice - startPrice) / startPrice) * 100;
          setPriceChange(changePercent);
        }

        // Calculate indicators
        const ma = computeSMA(priceData.current, 14);
        if (ma !== null) maSeries.update({ time, value: ma });

        const rsi = computeRSI(priceData.current, 14);
        if (rsi !== null) rsiSeries.update({ time, value: rsi });
      };
    };

    connect();

    // Add event listeners
    window.addEventListener('resize', handleResize);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      chart.remove();
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center">
            <span className="text-lg font-bold">BTC/USDT</span>
            <span className={`ml-2 text-sm ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
          {lastPrice && (
            <div className={`text-2xl font-bold ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
        <div className="border rounded-md p-2">
          <div className="text-muted-foreground">14日SMA</div>
          <div className="font-semibold text-amber-500">移動平均（オレンジ）</div>
        </div>
        <div className="border rounded-md p-2">
          <div className="text-muted-foreground">14日RSI</div>
          <div className="font-semibold text-blue-500">強弱指数（青）</div>
        </div>
        <div className="border rounded-md p-2">
          <div className="text-muted-foreground">時間スケール</div>
          <div className="font-semibold">リアルタイム</div>
        </div>
      </div>
    </div>
  );
}
