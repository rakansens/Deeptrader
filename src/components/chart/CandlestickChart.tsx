'use client'

import {
  createChart,
  CandlestickData,
  HistogramData,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
  LineData,
  UTCTimestamp
} from 'lightweight-charts'
import { useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Skeleton } from '@/components/ui/skeleton'
import IndicatorPanel from './IndicatorPanel'
import {
  computeSMA,
  computeRSI,
  computeMACD,
  computeBollinger,
} from '@/lib/indicators'
import useBinanceSocket from '@/hooks/use-binance-socket'
import useCandlestickData from '@/hooks/use-candlestick-data'


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
  const closePricesRef = useRef<number[]>([]) // 終値データを追跡するための参照

  // RSIパネル用のチャートと系列の参照
  const rsiChartRef = useRef<IChartApi | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  // MACDパネル用のチャートと系列の参照
  const macdChartRef = useRef<IChartApi | null>(null)
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const signalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const histogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const {
    candles = [],
    volumes = [],
    ma = [],
    rsi = [],
    macd = [],
    signal: signalData = [],
    bollUpper = [],
    bollLower = [],
    loading,
    error
  } = useCandlestickData(initialSymbol, initialInterval)

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
    url: `wss://stream.binance.com:9443/ws/${initialSymbol.toLowerCase()}@kline_${initialInterval}`,
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
    const storedCandles = localStorage.getItem(`candles_${initialSymbol}_${initialInterval}`)
    const storedVolumes = localStorage.getItem(`volumes_${initialSymbol}_${initialInterval}`)
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
    
    // RSIとMACDは専用パネルで表示するためメインチャートには追加しない

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

  const preprocessLineData = (arr: LineData[]): LineData[] => {
    if (!arr || arr.length === 0) return []

    const getNumTime = (t: LineData['time']): number => {
      if (typeof t === 'number') return t
      // BusinessDay object -> Date
      if (typeof t === 'object' && t !== null && 'year' in t && 'month' in t && 'day' in t) {
        const bd = t as { year: number; month: number; day: number }
        return Math.floor(new Date(bd.year, bd.month - 1, bd.day).getTime() / 1000)
      }
      // string fallback
      return Math.floor(new Date(t as unknown as string).getTime() / 1000)
    }

    // ソート（昇順かつ安定）
    const sorted = [...arr].sort((a, b) => {
      const ta = getNumTime(a.time)
      const tb = getNumTime(b.time)
      return ta - tb
    })
    // 重複除去（最初の出現を保持）
    const dedup: LineData[] = []
    let lastTime: number | null = null
    for (const item of sorted) {
      const t = getNumTime(item.time)
      if (t !== lastTime) {
        dedup.push(item)
        lastTime = t
      }
    }
    return dedup
  }

  const ensureSeries = (
    cond: boolean,
    ref: React.MutableRefObject<ReturnType<IChartApi['addLineSeries']> | null>,
    opts: any,
    data: LineData[]
  ) => {
    const chartInstance = chartRef.current
    if (cond) {
      if (chartInstance && !ref.current) {
        ref.current = chartInstance.addLineSeries(opts)
      }
      const preprocessed = preprocessLineData(data)
      if (ref.current && preprocessed.length > 0) {
        ref.current.setData(preprocessed)
      }
    } else if (ref.current && chartInstance) {
      try {
        chartInstance.removeSeries(ref.current)
      } catch (e) {
        console.error('Error removing series:', e)
      }
      ref.current = null
    }
  }

  // インジケーター表示切り替え
  useEffect(() => {
    if (!chartRef.current) return
    const chart = chartRef.current

    ensureSeries(indicators.ma, maSeriesRef, { color: '#f59e0b', lineWidth: 2, priceLineVisible: false }, ma)

    if (macdSeriesRef.current) {
      try {
        chart.removeSeries(macdSeriesRef.current)
      } catch (e) {
        console.error('Error removing MACD series:', e)
      }
      macdSeriesRef.current = null
    }
    if (signalSeriesRef.current) {
      try {
        chart.removeSeries(signalSeriesRef.current)
      } catch (e) {
        console.error('Error removing signal series:', e)
      }
      signalSeriesRef.current = null
    }
    if (indicators.boll) {
      ensureSeries(true, bollUpperSeriesRef, { color: '#a855f7', lineWidth: 1, priceLineVisible: false }, bollUpper)
      ensureSeries(true, bollLowerSeriesRef, { color: '#a855f7', lineWidth: 1, priceLineVisible: false }, bollLower)
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
  }, [indicators, ma, bollUpper, bollLower])

  // タイムスタンプでソートし、重複を削除する関数
  const processTimeSeriesData = <T extends { time: unknown }>(
    data: T[],
    timeToNumber: (time: unknown) => number
  ): T[] => {
    if (!data || data.length === 0) return [];

    try {
      // タイムスタンプを数値に変換して、タイムスタンプと元のデータをペアにする
      const withTimestamps = data.map(item => ({
        timestamp: timeToNumber(item.time),
        data: item
      }));

      // タイムスタンプでソート (厳密な昇順)
      const sorted = [...withTimestamps].sort((a, b) => {
        // 同じタイムスタンプの場合は、元の順序を維持するために
        // 配列内のインデックスを使用して安定したソートを確保
        if (a.timestamp === b.timestamp) {
          return withTimestamps.indexOf(a) - withTimestamps.indexOf(b);
        }
        return a.timestamp - b.timestamp;
      });

      // 重複を削除（同じタイムスタンプの場合は最初のエントリを保持）
      const uniqueEntries: Array<T> = [];
      const seenTimestamps = new Set<number>();
      
      for (const { timestamp, data } of sorted) {
        if (!seenTimestamps.has(timestamp)) {
          seenTimestamps.add(timestamp);
          uniqueEntries.push(data);
        }
      }

      // 最終確認: 時間が厳密に昇順であることを確認
      for (let i = 1; i < uniqueEntries.length; i++) {
        const prevTime = timeToNumber(uniqueEntries[i-1].time);
        const currTime = timeToNumber(uniqueEntries[i].time);
        if (prevTime > currTime) {
          console.warn(`Data not in ascending order at index ${i}, fixing...`);
          // 問題があれば再度ソート (通常はここには来ないはず)
          return [...uniqueEntries].sort((a, b) => 
            timeToNumber(a.time) - timeToNumber(b.time)
          );
        }
      }

      return uniqueEntries;
    } catch (error) {
      console.error('Error processing time series data:', error);
      return [];
    }
  };

  useEffect(() => {
    const timeToNumber = (time: unknown): number => {
      if (time === null || time === undefined) return 0;
      if (typeof time === 'number') return time;
      if (typeof time === 'string') {
        const timestamp = new Date(time).getTime() / 1000;
        return isNaN(timestamp) ? 0 : Math.floor(timestamp);
      }
      if (typeof time === 'object' && time !== null) {
        if ('timestamp' in time && time.timestamp !== undefined) {
          return timeToNumber(time.timestamp);
        }
      }
      return 0;
    };

    try {
      // ローソク足データを処理
      if (candleSeriesRef.current && Array.isArray(candles) && candles.length > 0) {
        const processedCandles = processTimeSeriesData<CandlestickData>(candles, timeToNumber);
        if (processedCandles.length > 0) {
          candleSeriesRef.current.setData(processedCandles);
        }
      }
      
      // ボリュームデータを処理
      if (volumeSeriesRef.current && Array.isArray(volumes) && volumes.length > 0) {
        const processedVolumes = processTimeSeriesData<HistogramData>(volumes, timeToNumber);
        if (processedVolumes.length > 0) {
          volumeSeriesRef.current.setData(processedVolumes);
        }
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
    if (maSeriesRef.current && ma && ma.length > 0) {
      maSeriesRef.current.setData(preprocessLineData(ma as LineData[]))
    }
    if (rsiSeriesRef.current && rsi && rsi.length > 0) {
      rsiSeriesRef.current.setData(preprocessLineData(rsi as LineData[]))
    }
    if (macdSeriesRef.current && macd && macd.length > 0) {
      macdSeriesRef.current.setData(preprocessLineData(macd as LineData[]))
    }
    if (signalSeriesRef.current && signalData && signalData.length > 0) {
      signalSeriesRef.current.setData(preprocessLineData(signalData as LineData[]))
    }
    if (bollUpperSeriesRef.current && bollUpper && bollUpper.length > 0) {
      bollUpperSeriesRef.current.setData(preprocessLineData(bollUpper as LineData[]))
    }
    if (bollLowerSeriesRef.current && bollLower && bollLower.length > 0) {
      bollLowerSeriesRef.current.setData(preprocessLineData(bollLower as LineData[]))
    }
  }, [candles, volumes, ma, rsi, macd, signalData, bollUpper, bollLower])



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
      if (rsiSeriesRef.current && rsi && rsi.length > 0) {
        rsiSeriesRef.current.setData(rsi as LineData[])
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
      if (macdSeriesRef.current && macd && macd.length > 0) {
        macdSeriesRef.current.setData(macd as LineData[])
      }
      if (signalSeriesRef.current && signalData && signalData.length > 0) {
        signalSeriesRef.current.setData(signalData as LineData[])
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
