import { useEffect, useRef, useState } from 'react'
import {
  CandlestickData,
  HistogramData,
  LineData,
  UTCTimestamp
} from 'lightweight-charts'
import type { BinanceKline, BinanceKlineMessage } from "@/types/binance"
import {
  computeSMA,
  computeRSI,
  computeMACD,
  computeBollinger
} from '@/lib/indicators'

export interface UseCandlestickDataResult {
  candles: CandlestickData[]
  volumes: HistogramData[]
  ma: LineData[]
  rsi: LineData[]
  macd: LineData[]
  signal: LineData[]
  bollUpper: LineData[]
  bollLower: LineData[]
  loading: boolean
  error: string | null
  connected: boolean
}


const PING_INTERVAL = 3 * 60 * 1000 // 3分ごとにPING
const PONG_TIMEOUT = 10 * 1000 // 10秒以内にPONGが必要

/**
 * ローソク足データを取得しローカルストレージへ保存するフック
 * @param symbol - 取得する通貨ペア
 * @param interval - 時間枠
 * @returns 各種データと状態
 */
export function useCandlestickData(
  symbol: string,
  interval: string
): UseCandlestickDataResult {
  const [candles, setCandles] = useState<CandlestickData[]>(() => {
    try {
      const stored = localStorage.getItem(`candles_${symbol}_${interval}`)
      return stored ? (JSON.parse(stored) as CandlestickData[]) : []
    } catch {
      return []
    }
  })
  const [volumes, setVolumes] = useState<HistogramData[]>(() => {
    try {
      const stored = localStorage.getItem(`volumes_${symbol}_${interval}`)
      return stored ? (JSON.parse(stored) as HistogramData[]) : []
    } catch {
      return []
    }
  })
  const [ma, setMa] = useState<LineData[]>([])
  const [rsi, setRsi] = useState<LineData[]>([])
  const [macd, setMacd] = useState<LineData[]>([])
  const [signal, setSignal] = useState<LineData[]>([])
  const [bollUpper, setBollUpper] = useState<LineData[]>([])
  const [bollLower, setBollLower] = useState<LineData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const pricesRef = useRef<number[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIdRef = useRef<number>(0)
  const reconnectCountRef = useRef(0)
  const isMountedRef = useRef<boolean>(true)
  const lastPingRef = useRef<number>(0)
  const socketIdRef = useRef<number>(1)

  // 初期データのロード（REST API経由）
  const loadInitialData = async (controller: AbortController) => {
    if (!isMountedRef.current) return;
    
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`
      console.log(`Fetching initial data from: ${url}`);
      const res = await fetch(url, { signal: controller.signal })
      
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`)
      
      const raw = (await res.json()) as BinanceKline[]
      
      // コンポーネントがアンマウントされていたら処理を中止
      if (!isMountedRef.current) return;
      
      console.log(`Received ${raw.length} candles from API`);
      
      const c: CandlestickData[] = []
      const v: HistogramData[] = []
      const maArr: LineData[] = []
      const rsiArr: LineData[] = []
      const macdArr: LineData[] = []
      const sigArr: LineData[] = []
      const bUp: LineData[] = []
      const bLow: LineData[] = []

      raw.forEach((d: BinanceKline) => {
        const [openTime, open, high, low, close, vol] = d;
        const candle: CandlestickData = {
          time: (openTime / 1000) as UTCTimestamp,
          open: parseFloat(open),
          high: parseFloat(high),
          low: parseFloat(low),
          close: parseFloat(close)
        }
        c.push(candle)

        const volume: HistogramData = {
          time: (openTime / 1000) as UTCTimestamp,
          value: parseFloat(vol),
          color: parseFloat(close) >= parseFloat(open) ? '#26a69a' : '#ef5350'
        }
        v.push(volume)

        pricesRef.current.push(candle.close)
        const maVal = computeSMA(pricesRef.current, 14)
        if (maVal !== null) maArr.push({ time: candle.time, value: maVal })
        const rsiVal = computeRSI(pricesRef.current, 14)
        if (rsiVal !== null) rsiArr.push({ time: candle.time, value: rsiVal })
        const macdVal = computeMACD(pricesRef.current)
        if (macdVal) {
          macdArr.push({ time: candle.time, value: macdVal.macd })
          sigArr.push({ time: candle.time, value: macdVal.signal })
        }
        const bollVal = computeBollinger(pricesRef.current)
        if (bollVal) {
          bUp.push({ time: candle.time, value: bollVal.upper })
          bLow.push({ time: candle.time, value: bollVal.lower })
        }
      })

      if (!isMountedRef.current) return;
      
      setCandles(c)
      setVolumes(v)
      setMa(maArr)
      setRsi(rsiArr)
      setMacd(macdArr)
      setSignal(sigArr)
      setBollUpper(bUp)
      setBollLower(bLow)
      
      try {
        localStorage.setItem(`candles_${symbol}_${interval}`, JSON.stringify(c))
        localStorage.setItem(`volumes_${symbol}_${interval}`, JSON.stringify(v))
      } catch (storageError) {
        console.warn('localStorage error:', storageError);
      }
      
      setLoading(false)
    } catch (e) {
      // コンポーネントがアンマウントされていたら処理を中止
      if (!isMountedRef.current) return;
      
      // AbortErrorはユーザーに表示しない（通常の動作）
      if (e instanceof DOMException && e.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      
      console.error('Initial data fetch error:', e)
      setError((e as Error).message)
      setLoading(false)
    }
  }
  
  // タイマーとインターバルをクリア
  const clearTimers = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  };
  
  // 既存のWebSocket接続をクリーンアップ
  const cleanupWebSocket = () => {
    clearTimers();
    
    if (wsRef.current) {
      try {
        const ws = wsRef.current;
        
        // イベントリスナーをクリア
        ws.onopen = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        
        // 接続を閉じる
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      } catch (e) {
        console.warn('WebSocket cleanup error:', e);
      }
      
      wsRef.current = null;
    }
  };
  
  // WebSocket接続を確立する関数
  const connectWebSocket = () => {
    if (!isMountedRef.current) return;
    
    // 前回の接続があれば安全にクリーンアップ
    cleanupWebSocket();
    
    try {
      // 一意のSocket IDを生成（再接続時に区別するため）
      socketIdRef.current = Date.now();
      const currentSocketId = socketIdRef.current;
      
      // WebSocket接続URL
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      
      wsRef.current = new WebSocket(wsUrl);
      const ws = wsRef.current;
      
      // 接続イベント
      ws.onopen = () => {
        // 他のソケットで既に置き換えられていないか確認
        if (!isMountedRef.current || socketIdRef.current !== currentSocketId) return;
        
        console.log('WebSocket connected');
        setConnected(true);
        setError(null);
        reconnectCountRef.current = 0;
        
        // サブスクリプションメッセージを送信
        const subscribeMsg = {
          method: 'SUBSCRIBE',
          params: [`${symbol.toLowerCase()}@kline_${interval}`],
          id: currentSocketId
        };
        ws.send(JSON.stringify(subscribeMsg));
        
        // Pingを定期送信して接続を維持
        lastPingRef.current = Date.now();
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            lastPingRef.current = Date.now();
            pingIdRef.current += 1;
            ws.send(
              JSON.stringify({ method: 'PING', id: pingIdRef.current })
            );

            // PONGが返らなければ再接続
            pongTimeoutRef.current = setTimeout(() => {
              if (wsRef.current === ws) {
                cleanupWebSocket();
                tryReconnect();
              }
            }, PONG_TIMEOUT);
          }
        }, PING_INTERVAL);
      };
      
      // メッセージ受信イベント
      ws.onmessage = (ev) => {
        // 他のソケットで既に置き換えられていないか確認
        if (!isMountedRef.current || socketIdRef.current !== currentSocketId) return;
        
        try {
          const data = JSON.parse(ev.data) as BinanceKlineMessage;
          
          // PONGレスポンスの処理
          if (data.result === null && typeof data.id === 'number') {
            if (data.id === pingIdRef.current && pongTimeoutRef.current) {
              clearTimeout(pongTimeoutRef.current)
              pongTimeoutRef.current = null
            }
            return
          }
          
          // キャンドルスティックデータ
          if (data.k) {
            const k = data.k;
            const candle: CandlestickData = {
              time: (k.t / 1000) as UTCTimestamp,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c)
            };
            
            setCandles((prev) => {
              // 既存のデータを更新または追加
              const existingIndex = prev.findIndex(c => c.time === candle.time);
              let arr = [...prev];
              
              if (existingIndex >= 0) {
                // 既存のキャンドルを更新
                arr[existingIndex] = candle;
              } else {
                // 新しいキャンドルを追加
                arr = [...arr, candle];
                // 500件を超えたら古いものから削除
                if (arr.length > 500) arr.shift();
              }
              
              try {
                localStorage.setItem(`candles_${symbol}_${interval}`, JSON.stringify(arr));
              } catch (e) {
                console.warn('localStorage error:', e);
              }
              
              return arr;
            });

            const volume: HistogramData = {
              time: (k.t / 1000) as UTCTimestamp,
              value: parseFloat(k.v),
              color: parseFloat(k.c) >= parseFloat(k.o) ? '#26a69a' : '#ef5350'
            };
            
            setVolumes((prev) => {
              const existingIndex = prev.findIndex(v => v.time === volume.time);
              let arr = [...prev];
              
              if (existingIndex >= 0) {
                arr[existingIndex] = volume;
              } else {
                arr = [...arr, volume];
                if (arr.length > 500) arr.shift();
              }
              
              try {
                localStorage.setItem(`volumes_${symbol}_${interval}`, JSON.stringify(arr));
              } catch (e) {
                console.warn('localStorage error:', e);
              }
              
              return arr;
            });

            // インジケーター計算
            pricesRef.current.push(candle.close);
            if (pricesRef.current.length > 1000) pricesRef.current.shift();
            
            // 移動平均の計算と更新
            const maVal = computeSMA(pricesRef.current, 14);
            if (maVal !== null) {
              setMa((prev) => {
                const newPoint = { time: candle.time, value: maVal };
                const existingIndex = prev.findIndex(p => p.time === newPoint.time);
                
                if (existingIndex >= 0) {
                  const newArr = [...prev];
                  newArr[existingIndex] = newPoint;
                  return newArr;
                }
                return [...prev, newPoint];
              });
            }
            
            // RSIの計算と更新
            const rsiVal = computeRSI(pricesRef.current, 14);
            if (rsiVal !== null) {
              setRsi((prev) => {
                const newPoint = { time: candle.time, value: rsiVal };
                const existingIndex = prev.findIndex(p => p.time === newPoint.time);
                
                if (existingIndex >= 0) {
                  const newArr = [...prev];
                  newArr[existingIndex] = newPoint;
                  return newArr;
                }
                return [...prev, newPoint];
              });
            }
            
            // MACDの計算と更新
            const macdVal = computeMACD(pricesRef.current);
            if (macdVal) {
              setMacd((prev) => {
                const newPoint = { time: candle.time, value: macdVal.macd };
                const existingIndex = prev.findIndex(p => p.time === newPoint.time);
                
                if (existingIndex >= 0) {
                  const newArr = [...prev];
                  newArr[existingIndex] = newPoint;
                  return newArr;
                }
                return [...prev, newPoint];
              });
              
              setSignal((prev) => {
                const newPoint = { time: candle.time, value: macdVal.signal };
                const existingIndex = prev.findIndex(p => p.time === newPoint.time);
                
                if (existingIndex >= 0) {
                  const newArr = [...prev];
                  newArr[existingIndex] = newPoint;
                  return newArr;
                }
                return [...prev, newPoint];
              });
            }
            
            // ボリンジャーバンドの計算と更新
            const bollVal = computeBollinger(pricesRef.current);
            if (bollVal) {
              setBollUpper((prev) => {
                const newPoint = { time: candle.time, value: bollVal.upper };
                const existingIndex = prev.findIndex(p => p.time === newPoint.time);
                
                if (existingIndex >= 0) {
                  const newArr = [...prev];
                  newArr[existingIndex] = newPoint;
                  return newArr;
                }
                return [...prev, newPoint];
              });
              
              setBollLower((prev) => {
                const newPoint = { time: candle.time, value: bollVal.lower };
                const existingIndex = prev.findIndex(p => p.time === newPoint.time);
                
                if (existingIndex >= 0) {
                  const newArr = [...prev];
                  newArr[existingIndex] = newPoint;
                  return newArr;
                }
                return [...prev, newPoint];
              });
            }
          }
        } catch (e) {
          console.error('WebSocket message processing error:', e);
        }
      };
      
      // エラーイベント
      ws.onerror = (e) => {
        if (!isMountedRef.current || socketIdRef.current !== currentSocketId) return;
        console.error('WebSocket error:', e);
        setError('WebSocket connection error');
      };
      
      // 接続終了イベント
      ws.onclose = (e) => {
        if (!isMountedRef.current || socketIdRef.current !== currentSocketId) return;
        console.log(`WebSocket closed: ${e.code} ${e.reason}`);
        setConnected(false);
        
        // 明示的に閉じられていない場合は再接続
        if (wsRef.current === ws) {
          clearTimers();
          tryReconnect();
        }
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
      setConnected(false);
      setError('Failed to connect to WebSocket');
      
      // エラー時も再接続を試みる
      tryReconnect();
    }
  };
  
  // 再接続を試みる関数
  const tryReconnect = () => {
    if (!isMountedRef.current) return;
    
    // 再接続回数に応じてバックオフを増やす（最大30秒）
    const maxAttempts = 10;
    if (reconnectCountRef.current < maxAttempts) {
      reconnectCountRef.current++;
      
      // 指数バックオフで待機時間を増やす
      const delay = Math.min(1000 * Math.pow(1.5, reconnectCountRef.current), 30000);
      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current}/${maxAttempts})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          connectWebSocket();
        }
      }, delay);
    } else {
      console.log('Maximum reconnection attempts reached');
      setError('WebSocket connection failed after multiple attempts. Please refresh the page.');
    }
  };

  useEffect(() => {
    console.log(`Setting up candlestick data for ${symbol} with ${interval} interval`);
    isMountedRef.current = true;
    reconnectCountRef.current = 0;
    
    // 以前の接続や要求があれば安全にクリーンアップ
    cleanupWebSocket();
    
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
      } catch (e) {
        console.warn('AbortController abort error:', e);
      }
      controllerRef.current = null;
    }
    
    // 新しいコントローラーを作成
    controllerRef.current = new AbortController();
    
    // 状態をリセット
    setLoading(true);
    setError(null);
    setConnected(false);
    pricesRef.current = [];
    setMa([]);
    setRsi([]);
    setMacd([]);
    setSignal([]);
    setBollUpper([]);
    setBollLower([]);

    // 初期データの読み込み
    loadInitialData(controllerRef.current).then(() => {
      // データロード完了後にWebSocket接続
      if (isMountedRef.current) {
        connectWebSocket();
      }
    });

    // クリーンアップ関数
    return () => {
      console.log(`Cleaning up candlestick data for ${symbol}`);
      isMountedRef.current = false;
      
      // タイマーとWebSocketをクリーンアップ
      cleanupWebSocket();
      
      // AbortControllerをクリーンアップ
      if (controllerRef.current) {
        try {
          controllerRef.current.abort();
        } catch (e) {
          console.warn('Cleanup AbortController error:', e);
        }
        controllerRef.current = null;
      }
      
      pricesRef.current = [];
    }
  }, [symbol, interval]);

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
    connected
  };
}

export default useCandlestickData
