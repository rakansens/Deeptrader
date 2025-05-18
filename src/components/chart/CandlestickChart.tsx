'use client'

import {
  createChart,
  IChartApi,
  LineData,
  CandlestickData,
  HistogramData,
  ISeriesApi,
  UTCTimestamp,
  CrosshairMode
} from 'lightweight-charts'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import IndicatorPanel from './IndicatorPanel'
import {
  computeSMA,
  computeRSI,
  computeMACD,
  computeBollinger,
} from '@/lib/indicators'
import useBinanceSocket from '@/hooks/use-binance-socket'


interface IndicatorOptions {
  ma: boolean
  rsi: boolean
  macd?: boolean
  boll?: boolean
}

interface CandlestickChartProps {
  className?: string
  height?: number
  symbol?: string
  interval?: string
  useApi?: boolean
  indicators?: IndicatorOptions
  onIndicatorsChange?: (value: IndicatorOptions) => void
}

/**
 * Binanceのローソク足データを表示するチャートコンポーネント
 * APIモードでは/api/candlesエンドポイントからデータを取得
 * 直接モードではBinance APIに直接アクセス
 */
export default function CandlestickChart({
  className,
  height = 400,
  symbol: initialSymbol = 'BTCUSDT',
  interval: initialInterval = '1m',
  useApi = false,
  indicators = { ma: false, rsi: false, macd: false, boll: false },
  onIndicatorsChange
}: CandlestickChartProps) {
  const { theme = 'light' } = useTheme()
  
  // テーマに応じた色を取得する関数
  const getThemeColors = useCallback(() => {
    const isDark = theme === 'dark'
    return {
      background: isDark ? '#1e1e1e' : '#ffffff',
      text: isDark ? '#d1d5db' : '#111827',
      grid: isDark ? '#2f3338' : '#e0e0e0',
      crosshair: isDark ? '#d1d5db' : '#111827',
      upColor: '#26a69a',
      downColor: '#ef5350',
      volume: '#4b5563'
    }
  }, [theme])
  
  // テーマカラーをメモ化
  const themeColors = getThemeColors()
  const containerRef = useRef<HTMLDivElement>(null)  // メインチャートとシリーズの参照
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const maSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bollUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bollLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  // RSIパネル用のチャートと系列の参照
  const rsiChartRef = useRef<IChartApi | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  // MACDパネル用のチャートと系列の参照
  const macdChartRef = useRef<IChartApi | null>(null)
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const signalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const histogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const closePricesRef = useRef<number[]>([])
  const maDataRef = useRef<LineData[]>([])
  const rsiDataRef = useRef<LineData[]>([])
  const macdLineDataRef = useRef<LineData[]>([])
  const signalLineDataRef = useRef<LineData[]>([])
  const bollUpperDataRef = useRef<LineData[]>([])
  const bollLowerDataRef = useRef<LineData[]>([])

  const [symbol, setSymbol] = useState(initialSymbol)
  const [interval, setInterval] = useState(initialInterval)

  // 外部からのprops変更を検知して内部状態を更新
  useEffect(() => {
    if (initialInterval !== interval) {
      setInterval(initialInterval)
    }
  }, [initialInterval])
  
  useEffect(() => {
    if (initialSymbol !== symbol) {
      setSymbol(initialSymbol)
    }
  }, [initialSymbol])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleSocketMessage = useCallback(
    (msg: any) => {
      const k = msg.k
      const candle: CandlestickData = {
        time: (k.t / 1000) as UTCTimestamp,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
      }
      candleSeriesRef.current?.update(candle)
      const volume: HistogramData = {
        time: (k.t / 1000) as UTCTimestamp,
        value: parseFloat(k.v),
        color: parseFloat(k.c) >= parseFloat(k.o) ? '#26a69a' : '#ef5350',
      }
      volumeSeriesRef.current?.update(volume)

      closePricesRef.current.push(candle.close)
      if (closePricesRef.current.length > 1000) closePricesRef.current.shift()

      const ma = computeSMA(closePricesRef.current, 14)
      if (ma !== null && maSeriesRef.current) {
        maSeriesRef.current.update({ time: candle.time, value: ma })
      }

      const rsi = computeRSI(closePricesRef.current, 14)
      if (rsi !== null && rsiSeriesRef.current) {
        rsiSeriesRef.current.update({ time: candle.time, value: rsi })
      }

      const macd = computeMACD(closePricesRef.current)
      if (macd && macdSeriesRef.current && signalSeriesRef.current) {
        macdSeriesRef.current.update({ time: candle.time, value: macd.macd })
        signalSeriesRef.current.update({ time: candle.time, value: macd.signal })
      }

      const boll = computeBollinger(closePricesRef.current)
      if (boll && bollUpperSeriesRef.current && bollLowerSeriesRef.current) {
        bollUpperSeriesRef.current.update({ time: candle.time, value: boll.upper })
        bollLowerSeriesRef.current.update({ time: candle.time, value: boll.lower })
      }
    },
    []
  )

  useBinanceSocket({
    url: `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`,
    onMessage: handleSocketMessage,
  })

  // チャートの初期化
  useEffect(() => {
    if (!containerRef.current) return

    const colors = getThemeColors()

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: colors.background },
        textColor: colors.text,
      },
      // グリッド線の色をテーマに合わせる
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      // クロスヘア設定: 常に表示しラインの色を調整
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { 
          color: colors.crosshair,
          labelVisible: true,
          labelBackgroundColor: colors.background
        },
        horzLine: { 
          color: colors.crosshair,
          labelVisible: true,
          labelBackgroundColor: colors.background
        }
      },
      // 価格スケール: 枠線を表示して価格ラインのスペースを確保
      rightPriceScale: {
        borderColor: colors.grid,
        borderVisible: true,
        scaleMargins: {
          top: 0.1, // 上部に少し余白を持たせる
          bottom: 0.2, // 下部に20%の余薄を確保し、インジケーターのスペースを作る
        },
      },
      timeScale: { 
        borderColor: colors.grid, 
        timeVisible: true 
      },
    })

    chartRef.current = chart
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: colors.upColor,
      downColor: colors.downColor,
      wickUpColor: colors.upColor,
      wickDownColor: colors.downColor,
      borderVisible: false,
    })
    
    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
      color: colors.volume,
    })

    // データがあれば複数のローソク足データを再設定する
    const storedCandles = localStorage.getItem(`candles_${symbol}_${interval}`)
    const storedVolumes = localStorage.getItem(`volumes_${symbol}_${interval}`)
    if (storedCandles && candleSeriesRef.current) {
      try {
        const candles = JSON.parse(storedCandles) as CandlestickData[]
        candleSeriesRef.current.setData(candles)
      } catch (e) {
        console.error('Failed to parse stored candles', e)
      }
    }
    if (storedVolumes && volumeSeriesRef.current) {
      try {
        const volumes = JSON.parse(storedVolumes) as HistogramData[]
        volumeSeriesRef.current.setData(volumes)
      } catch (e) {
        console.error('Failed to parse stored volumes', e)
      }
    }

    // メイン価格チャートに追加するインジケーター
    if (indicators.ma) {
      maSeriesRef.current = chart.addLineSeries({ 
        color: '#f59e0b', 
        lineWidth: 2, 
        priceLineVisible: false,
        // メイン価格チャートに表示
        priceScaleId: 'right' 
      })
    }
    if (indicators.boll) {
      bollUpperSeriesRef.current = chart.addLineSeries({ 
        color: '#a855f7', 
        lineWidth: 1, 
        priceLineVisible: false,
        // メイン価格チャートに表示
        priceScaleId: 'right' 
      })
      bollLowerSeriesRef.current = chart.addLineSeries({ 
        color: '#a855f7', 
        lineWidth: 1, 
        priceLineVisible: false,
        // メイン価格チャートに表示
        priceScaleId: 'right' 
      })
    }
    
    // RSIは独自の表示領域に表示
    if (indicators.rsi) {
      rsiSeriesRef.current = chart.addLineSeries({ 
        color: '#3b82f6', 
        lineWidth: 1, 
        priceLineVisible: false,
        priceScaleId: 'rsi',
        // RSIは0-100の範囲に固定
        autoscaleInfoProvider: () => ({
          priceRange: {
            minValue: 0,
            maxValue: 100,
          },
        }),
      })
      
      // RSIの表示領域設定 - 高さを小さくしてローソク足を圧迫しないようにする
      chart.priceScale('rsi').applyOptions({
        scaleMargins: {
          // メインチャートの下部に小さく配置
          top: 0.8, // 上部に80%のスペースを確保し、下部に小さく表示
          bottom: 0.02, // 下部の余白を少なく
        },
        visible: true,
        autoScale: true, // 自動スケールを有効に
      });
    }
    
    // MACDは下部の独自領域に表示
    if (indicators.macd) {
      macdSeriesRef.current = chart.addLineSeries({ 
        color: '#10b981', 
        lineWidth: 1, 
        priceLineVisible: false,
        priceScaleId: 'macd',
      })
      signalSeriesRef.current = chart.addLineSeries({ 
        color: '#ef4444', 
        lineWidth: 1, 
        priceLineVisible: false,
        priceScaleId: 'macd',
      })
      
      // MACDの表示領域設定 - RSIの下に小さく表示
      chart.priceScale('macd').applyOptions({
        scaleMargins: {
          top: 0.85, // 上部に85%のスペースを確保
          bottom: 0.02, // 下部の余白を少なく
        },
        visible: true,
        autoScale: true, // 自動スケールを有効に
      });
    }

    // ボリュームのスケール設定 - より小さく表示
    chart.priceScale('vol').applyOptions({
      scaleMargins: {
        top: 0.9, // 上部に90%のスペースを確保し、ボリュームはより小さく
        bottom: 0,
      },
    });

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(containerRef.current.clientWidth, height)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  // チャートの初期化依存配列からindicatorsを除外
  // indicatorsの変更時にチャートを再作成するとローソク足がリセットされる
  }, [theme, height])

  // テーマ変更時のスタイル更新
  useEffect(() => {
    if (!chartRef.current) return
    
    const colors = getThemeColors()
    
    // チャートのスタイルを更新
    chartRef.current.applyOptions({
      layout: {
        background: { color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { 
          color: colors.crosshair,
          labelVisible: true,
          labelBackgroundColor: colors.background
        },
        horzLine: { 
          color: colors.crosshair,
          labelVisible: true,
          labelBackgroundColor: colors.background
        }
      },
      rightPriceScale: { 
        borderColor: colors.grid,
        borderVisible: true
      },
      timeScale: { 
        borderColor: colors.grid,
        timeVisible: true
      },
    })
    
    // ローソク足の色も更新
    if (candleSeriesRef.current) {
      candleSeriesRef.current.applyOptions({
        upColor: colors.upColor,
        downColor: colors.downColor,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
        borderVisible: false,
      })
    }
    
    // ボリュームの色も更新
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.applyOptions({
        color: colors.volume
      })
    }
  }, [theme, getThemeColors])

  // インジケーター表示切り替え
  useEffect(() => {
    if (!chartRef.current) return
    const chart = chartRef.current

    const ensureSeries = (cond: boolean, ref: React.MutableRefObject<ReturnType<IChartApi['addLineSeries']> | null>, opts: any, data: LineData[]) => {
      if (cond) {
        if (!ref.current) {
          ref.current = chart.addLineSeries(opts)
          // 系列が新しく作成された場合のみデータを設定
          if (data && data.length > 0) {
            ref.current.setData(data)
          }
        }
      } else if (ref.current && chart) {
        try {
          chart.removeSeries(ref.current)
        } catch (e) {
          console.error('Error removing series:', e)
        }
        ref.current = null
      }
    }

    ensureSeries(indicators.ma, maSeriesRef, { color: '#f59e0b', lineWidth: 2, priceLineVisible: false }, maDataRef.current)
    ensureSeries(indicators.rsi, rsiSeriesRef, { color: '#3b82f6', lineWidth: 1, priceLineVisible: false }, rsiDataRef.current)
    if (indicators.macd) {
      ensureSeries(true, macdSeriesRef, { color: '#10b981', lineWidth: 1, priceLineVisible: false }, macdLineDataRef.current)
      ensureSeries(true, signalSeriesRef, { color: '#ef4444', lineWidth: 1, priceLineVisible: false }, signalLineDataRef.current)
    } else {
      if (macdSeriesRef.current && chart) { 
        try {
          chart.removeSeries(macdSeriesRef.current)
        } catch (e) {
          console.error('Error removing MACD series:', e)
        }
        macdSeriesRef.current = null 
      }
      if (signalSeriesRef.current && chart) { 
        try {
          chart.removeSeries(signalSeriesRef.current)
        } catch (e) {
          console.error('Error removing signal series:', e)
        }
        signalSeriesRef.current = null 
      }
    }
    if (indicators.boll) {
      ensureSeries(true, bollUpperSeriesRef, { color: '#a855f7', lineWidth: 1, priceLineVisible: false }, bollUpperDataRef.current)
      ensureSeries(true, bollLowerSeriesRef, { color: '#a855f7', lineWidth: 1, priceLineVisible: false }, bollLowerDataRef.current)
    } else {
      if (bollUpperSeriesRef.current && chart) { 
        try {
          chart.removeSeries(bollUpperSeriesRef.current)
        } catch (e) {
          console.error('Error removing bollinger upper series:', e)
        }
        bollUpperSeriesRef.current = null 
      }
      if (bollLowerSeriesRef.current && chart) { 
        try {
          chart.removeSeries(bollLowerSeriesRef.current)
        } catch (e) {
          console.error('Error removing bollinger lower series:', e)
        }
        bollLowerSeriesRef.current = null 
      }
    }
  }, [indicators])

  // APIを使用したデータ取得
  useEffect(() => {
    if (!candleSeriesRef.current) return

    const controller = new AbortController()

    async function load() {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error('failed to fetch')
        const raw = (await res.json()) as unknown[]
        const candles: CandlestickData[] = []
        const volumes: HistogramData[] = []
        
        // データを処理してインジケーターに必要な情報も計算する
        raw.forEach((d: any) => {
          const candle: CandlestickData = {
            time: (d[0] / 1000) as UTCTimestamp,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          }
          candles.push(candle)
          
          const volume: HistogramData = {
            time: (d[0] / 1000) as UTCTimestamp,
            value: parseFloat(d[5]),
            color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#26a69a' : '#ef5350',
          }
          volumes.push(volume)

          const close = candle.close
          closePricesRef.current.push(close)

          // 移動平均の計算
          const ma = computeSMA(closePricesRef.current, 14)
          if (ma !== null) {
            const point = { time: candle.time, value: ma }
            maDataRef.current.push(point)
          }

          // RSIの計算
          const rsi = computeRSI(closePricesRef.current, 14)
          if (rsi !== null) {
            const point = { time: candle.time, value: rsi }
            rsiDataRef.current.push(point)
          }

          // MACDの計算
          const macd = computeMACD(closePricesRef.current)
          if (macd) {
            macdLineDataRef.current.push({ time: candle.time, value: macd.macd })
            signalLineDataRef.current.push({ time: candle.time, value: macd.signal })
          }

          // ボリンジャーバンドの計算
          const boll = computeBollinger(closePricesRef.current)
          if (boll) {
            bollUpperDataRef.current.push({ time: candle.time, value: boll.upper })
            bollLowerDataRef.current.push({ time: candle.time, value: boll.lower })
          }
        })

        // チャートにデータをセット
        // データをセットし、同時にlocalStorageに保存
        candleSeriesRef.current!.setData(candles)
        volumeSeriesRef.current!.setData(volumes)
        
        // データをローカルストレージに保存
        try {
          localStorage.setItem(`candles_${symbol}_${interval}`, JSON.stringify(candles))
          localStorage.setItem(`volumes_${symbol}_${interval}`, JSON.stringify(volumes))
        } catch (e) {
          console.error('Failed to save candles to localStorage', e)
        }
        
        // インジケーターにもデータをセット
        if (maSeriesRef.current) maSeriesRef.current.setData(maDataRef.current)
        if (rsiSeriesRef.current) rsiSeriesRef.current.setData(rsiDataRef.current)
        if (macdSeriesRef.current) macdSeriesRef.current.setData(macdLineDataRef.current)
        if (signalSeriesRef.current) signalSeriesRef.current.setData(signalLineDataRef.current)
        if (bollUpperSeriesRef.current) bollUpperSeriesRef.current.setData(bollUpperDataRef.current)
        if (bollLowerSeriesRef.current) bollLowerSeriesRef.current.setData(bollLowerDataRef.current)
      } catch (e) {
        console.error(e)
      }
    }
    load()

    return () => {
      controller.abort()
      // クリーンアップ時にデータもリセット
      closePricesRef.current = []
      maDataRef.current = []
      rsiDataRef.current = []
      macdLineDataRef.current = []
      signalLineDataRef.current = []
      bollUpperDataRef.current = []
      bollLowerDataRef.current = []
    }
  }, [symbol, interval, useApi]);

  // ローディング中の表示
  if (loading && useApi) {
    return <Skeleton data-testid="loading" className="w-full h-[300px]" />;
  }

  // エラー表示
  if (error && useApi) {
    return (
      <div data-testid="error" className="text-center text-sm text-red-500">
        {error}
      </div>
    );
  }

  const initRsiChart = useCallback(
    (el: HTMLDivElement) => {
      const rsiChart = createChart(el, {
        width: el.clientWidth,
        height: height * 0.2,
        layout: {
          background: { color: theme === 'dark' ? '#1e1e1e' : '#ffffff' },
          textColor: theme === 'dark' ? '#d1d5db' : '#111827',
        },
        grid: {
          vertLines: { color: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
          horzLines: { color: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
        },
        rightPriceScale: { borderColor: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
        timeScale: {
          borderColor: theme === 'dark' ? '#2f3338' : '#e0e0e0',
          timeVisible: true,
          visible: false,
        },
        handleScroll: { vertTouchDrag: false },
      })

      rsiChartRef.current = rsiChart
      rsiSeriesRef.current = rsiChart.addLineSeries({
        color: '#2962FF',
        lineWidth: 1,
        title: 'RSI',
        priceLineVisible: false,
        lastValueVisible: true,
      })
      if (rsiSeriesRef.current && rsiDataRef.current.length > 0) {
        rsiSeriesRef.current.setData(rsiDataRef.current)
      }
      if (chartRef.current) {
        const sub = (range: any) => {
          if (rsiChartRef.current && range !== null) {
            rsiChartRef.current.timeScale().setVisibleLogicalRange(range)
          }
        }
        chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(sub)
        return () => {
          chartRef.current?.timeScale().unsubscribeVisibleLogicalRangeChange(sub)
          rsiChart.remove()
          rsiChartRef.current = null
        }
      }
      return () => {
        rsiChart.remove()
        rsiChartRef.current = null
      }
    },
    [theme, height]
  )

  const initMacdChart = useCallback(
    (el: HTMLDivElement) => {
      const macdChart = createChart(el, {
        width: el.clientWidth,
        height: height * 0.2,
        layout: {
          background: { color: theme === 'dark' ? '#1e1e1e' : '#ffffff' },
          textColor: theme === 'dark' ? '#d1d5db' : '#111827',
        },
        grid: {
          vertLines: { color: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
          horzLines: { color: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
        },
        rightPriceScale: { borderColor: theme === 'dark' ? '#2f3338' : '#e0e0e0' },
        timeScale: { borderColor: theme === 'dark' ? '#2f3338' : '#e0e0e0', timeVisible: true },
      })

      macdChartRef.current = macdChart
      macdSeriesRef.current = macdChart.addLineSeries({
        color: '#2962FF',
        lineWidth: 1,
        title: 'MACD',
        priceLineVisible: false,
      })
      signalSeriesRef.current = macdChart.addLineSeries({
        color: '#FF6D00',
        lineWidth: 1,
        title: 'Signal',
        priceLineVisible: false,
      })
      histogramSeriesRef.current = macdChart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'price' },
        priceLineVisible: false,
      })
      if (macdSeriesRef.current && macdLineDataRef.current.length > 0) {
        macdSeriesRef.current.setData(macdLineDataRef.current)
      }
      if (signalSeriesRef.current && signalLineDataRef.current.length > 0) {
        signalSeriesRef.current.setData(signalLineDataRef.current)
      }
      if (chartRef.current) {
        const sub = (range: any) => {
          if (macdChartRef.current) {
            macdChartRef.current.timeScale().setVisibleLogicalRange(range)
          }
        }
        chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(sub)
        return () => {
          chartRef.current?.timeScale().unsubscribeVisibleLogicalRangeChange(sub)
          macdChart.remove()
          macdChartRef.current = null
        }
      }
      return () => {
        macdChart.remove()
        macdChartRef.current = null
      }
    },
    [theme, height]
  )
  
  const subPanelHeight = height * 0.2
  const mainChartHeight =
    height - (indicators.rsi ? subPanelHeight : 0) - (indicators.macd ? subPanelHeight : 0)
  
  return (
    <div className={className}>
      <div className="space-y-1">
        {/* メインチャート */}
        <div ref={containerRef} className="w-full" style={{ height: mainChartHeight }} data-testid="chart-container" />
        
        {indicators.rsi && (
          <IndicatorPanel
            title="RSI"
            height={subPanelHeight}
            onClose={() =>
              onIndicatorsChange?.({ ...indicators, rsi: false })
            }
            initChart={initRsiChart}
          />
        )}
        {indicators.macd && (
          <IndicatorPanel
            title="MACD"
            height={subPanelHeight}
            onClose={() =>
              onIndicatorsChange?.({ ...indicators, macd: false })
            }
            initChart={initMacdChart}
          />
        )}
      </div>
    </div>
  )
}
