'use client';

import { createChart, UTCTimestamp, IChartApi, ISeriesApi } from 'lightweight-charts';
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

/**
 * 指数移動平均を計算する
 */
function computeEMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

/**
 * MACDを計算する
 */
function computeMACD(
  data: number[],
  short = 12,
  long = 26,
  signalPeriod = 9
): { macd: number; signal: number; histogram: number } | null {
  if (data.length < long + signalPeriod) return null;
  const macdSeries: number[] = [];
  for (let i = long; i <= data.length; i++) {
    const slice = data.slice(0, i);
    const shortEma = computeEMA(slice, short);
    const longEma = computeEMA(slice, long);
    if (shortEma === null || longEma === null) continue;
    macdSeries.push(shortEma - longEma);
  }
  const macd = macdSeries[macdSeries.length - 1];
  const signal = computeEMA(macdSeries, signalPeriod);
  if (signal === null) return null;
  return { macd, signal, histogram: macd - signal };
}

export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const priceData = useRef<number[]>([]);
  const chartRef = useRef<IChartApi | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const maSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [initTime] = useState(Date.now());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const isMountedRef = useRef(true);

  // WebSocket接続を作成する関数
  const createWebSocketConnection = () => {
    try {
      if (!isMountedRef.current) return;

      // 既存の接続をクリーンアップ
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      setConnectionStatus('connecting');
      
      // 新しいWebSocket接続を作成
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket接続が確立されました');
        setConnectionStatus('connected');
      };
      
      ws.onclose = () => {
        console.log('WebSocket接続が閉じられました、再接続を試みます...');
        setConnectionStatus('disconnected');
        
        // 5秒後に再接続
        if (isMountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            createWebSocketConnection();
          }, 3000);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket接続エラー:', error);
        setConnectionStatus('disconnected');
        ws.close();
        
        // エラー発生時も再接続を試みる
        if (isMountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            createWebSocketConnection();
          }, 3000);
        }
      };
      
      // データ処理
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const price = parseFloat(msg.p);
          const time = Math.floor(msg.T / 1000) as UTCTimestamp;
          
          if (
            priceSeriesRef.current &&
            maSeriesRef.current &&
            rsiSeriesRef.current &&
            macdSeriesRef.current
          ) {
            priceSeriesRef.current.update({ time, value: price });
            
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
            if (ma !== null) maSeriesRef.current.update({ time, value: ma });
            
            const rsi = computeRSI(priceData.current, 14);
            if (rsi !== null) rsiSeriesRef.current.update({ time, value: rsi });

            const macd = computeMACD(priceData.current);
            if (macd !== null) macdSeriesRef.current.update({ time, value: macd.histogram });
          }
        } catch (error) {
          console.error('メッセージ処理エラー:', error);
        }
      };
    } catch (error) {
      console.error('WebSocket作成エラー:', error);
      
      // エラー発生時も再接続を試みる
      if (isMountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          createWebSocketConnection();
        }, 3000);
      }
    }
  };

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
    priceSeriesRef.current = priceSeries;
    
    const maSeries = chart.addLineSeries({ 
      color: '#f59e0b', 
      lineWidth: 2,
      priceLineVisible: false,
    });
    maSeriesRef.current = maSeries;
    
    const rsiSeries = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 1,
      priceScaleId: 'right',
      priceLineVisible: false,
    });
    rsiSeriesRef.current = rsiSeries;

    const macdSeries = chart.addLineSeries({
      color: '#10b981',
      lineWidth: 1,
      priceScaleId: 'right',
      priceLineVisible: false,
    });
    macdSeriesRef.current = macdSeries;

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(
          containerRef.current.clientWidth,
          380
        );
      }
    };
    
    // WebSocket接続を開始
    createWebSocketConnection();

    // Add event listeners
    window.addEventListener('resize', handleResize);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      
      // クリーンアップ処理
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
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
            <span className={`ml-2 text-sm ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
            <span className="ml-2 text-xs">
              {connectionStatus === 'connected' 
                ? '🟢 接続中' 
                : connectionStatus === 'connecting' 
                  ? '🟡 接続中...' 
                  : '🔴 未接続'}
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
      <div className="grid grid-cols-4 gap-2 text-xs mt-2">
        <div className="border rounded-md p-2">
          <div className="text-muted-foreground">14日SMA</div>
          <div className="font-semibold text-amber-500">移動平均（オレンジ）</div>
        </div>
        <div className="border rounded-md p-2">
          <div className="text-muted-foreground">14日RSI</div>
          <div className="font-semibold text-blue-500">強弱指数（青）</div>
        </div>
        <div className="border rounded-md p-2">
          <div className="text-muted-foreground">MACD</div>
          <div className="font-semibold text-emerald-500">ヒストグラム（緑）</div>
        </div>
        <div className="border rounded-md p-2">
          <div className="text-muted-foreground">時間スケール</div>
          <div className="font-semibold">リアルタイム</div>
        </div>
      </div>
    </div>
  );
}
