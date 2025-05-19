'use client';

import { UTCTimestamp, ISeriesApi, IChartApi } from 'lightweight-charts';
import { useEffect, useRef, useState, useCallback } from 'react';
import useBinanceSocket from '@/hooks/use-binance-socket';
import type { BinanceTradeMessage } from '@/types';
import { useChart } from '@/hooks/use-chart';
import {
  computeSMA,
  computeRSI,
  computeMACD,
} from '@/lib/indicators';
import { toNumericTime } from '@/lib/chart-utils';


export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const priceData = useRef<number[]>([]);
  const priceSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const maSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [initTime] = useState(Date.now());

  // 共通のチャート設定を使用
  const chart = useChart({
    container: containerRef.current,
    height: 380,
    timeVisible: true,
    secondsVisible: true
  }) as IChartApi & { isReady: () => boolean };

  // チャート初期化後にシリーズを追加
  useEffect(() => {
    // チャートが初期化されていない場合は何もしない
    if (!chart.isReady()) return;
    
    // 既に初期化済みの場合は何もしない
    if (priceSeriesRef.current) return;
    
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
    
    return () => {
      priceSeriesRef.current = null;
      maSeriesRef.current = null;
      rsiSeriesRef.current = null;
      macdSeriesRef.current = null;
    };
  }, [chart]);

  // WebSocket接続とデータ処理
  const { status: connectionStatus } = useBinanceSocket<BinanceTradeMessage>({
    url: 'wss://stream.binance.com:9443/ws/btcusdt@trade',
    onMessage: useCallback((msg: BinanceTradeMessage) => {
      const price = parseFloat(msg.p);
      const time = toNumericTime(msg.T) as UTCTimestamp;

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
        if (macd !== null) macdSeriesRef.current.update({ time, value: macd.histogram });
      }
    }, []),
  });

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
