import { useEffect, useMemo, useRef } from 'react'
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData, UTCTimestamp } from 'lightweight-charts'
import { processTimeSeriesData, toNumericTime } from '@/lib/chart-utils'
import { logger } from '@/lib/logger'

// 🛠️ 2025-05-22: シリーズ生成時に破棄済みチャートへアクセスし例外が発生するケースを try/catch で吸収。
//               OrderBook パネルの開閉に伴うチャート再生成時のクラッシュを防止。

interface CandlestickSeriesColors {
  upColor: string
  downColor: string
  volume: string
  volumeUp?: string  // 上昇時の出来高カラー（オプション）
  volumeDown?: string  // 下降時の出来高カラー（オプション）
  volumeBackground?: string  // 出来高の背景色（オプション）
}

interface UseCandlestickSeriesParams {
  chart: IChartApi | null
  candleRef: React.MutableRefObject<ISeriesApi<'Candlestick'> | null>
  volumeRef: React.MutableRefObject<ISeriesApi<'Histogram'> | null>
  candles: CandlestickData[]
  volumes: HistogramData[]
  colors: CandlestickSeriesColors
}

/**
 * ローソク足シリーズと出来高シリーズを管理するフック
 */
export function useCandlestickSeries({
  chart,
  candleRef,
  volumeRef,
  candles,
  volumes,
  colors,
}: UseCandlestickSeriesParams) {
  const prevCandleLength = useRef(0)
  const prevFirstTimeRef = useRef<number | null>(null)
  const prevVolumeLength = useRef(0)
  const prevVolFirstTimeRef = useRef<number | null>(null)
  const processedCandles = useMemo(
    () => processTimeSeriesData<CandlestickData>(candles, toNumericTime),
    [candles]
  )
  const processedVolumes = useMemo(
    () => processTimeSeriesData<HistogramData>(volumes, toNumericTime),
    [volumes]
  )

  // ボリュームの色を適用
  const volumeColor = useMemo(() => colors.volume, [colors.volume]);
  // ボリュームの背景色
  const volumeBackground = useMemo(() => 
    colors.volumeBackground || '#1a2832', 
    [colors.volumeBackground]
  );

  // シリーズの生成と破棄
  useEffect(() => {
    const MAX_RETRY = 5;
    let attempt = 0;
    const createSeries = () => {
      const c = chart;
      if (!c) return;
      try {
        if (
          !candleRef.current &&
          typeof (c as unknown as { addCandlestickSeries?: Function }).addCandlestickSeries ===
            "function"
        ) {
          candleRef.current = c.addCandlestickSeries({
            upColor: colors.upColor,
            downColor: colors.downColor,
            wickUpColor: colors.upColor,
            wickDownColor: colors.downColor,
            borderVisible: false,
          });
          if (processedCandles.length > 0) {
            candleRef.current.setData(processedCandles);
            prevCandleLength.current = processedCandles.length;
            prevFirstTimeRef.current = (processedCandles[0]?.time as number) ?? null;
          }
        }

        if (
          !volumeRef.current &&
          typeof (c as unknown as { addHistogramSeries?: Function }).addHistogramSeries ===
            "function"
        ) {
          volumeRef.current = c.addHistogramSeries({
            priceFormat: { 
              type: "volume",
              precision: 0, // 整数表示
              minMove: 0.01, // 最小変動幅
            },
            priceScaleId: "vol",
            color: volumeColor,
            base: 0,
          });
          
          // 出来高のプライススケール設定
          c.priceScale("vol").applyOptions({ 
            scaleMargins: { top: 0.7, bottom: 0 }, // 上部マージンを縮小（より多くのスペースを使用）
            visible: true, // スケールを表示
            borderVisible: true, // 境界線を表示
            borderColor: volumeBackground, // 境界色
            entireTextOnly: false, // 数値を完全に表示
            autoScale: true, // 自動スケーリング
          });
          if (processedVolumes.length > 0) {
            volumeRef.current.setData(processedVolumes);
            prevVolumeLength.current = processedVolumes.length;
            prevVolFirstTimeRef.current = (processedVolumes[0]?.time as number) ?? null;
          }
        }
      } catch (err) {
        logger.warn("Series creation failed, retrying", err);
        attempt += 1;
        if (attempt < MAX_RETRY) {
          setTimeout(createSeries, 200);
        }
      }
    };

    createSeries();

    return () => {
      if (candleRef.current && chart) {
        try {
          chart.removeSeries(candleRef.current)
        } catch {
          /* ignore */
        }
        candleRef.current = null
        prevCandleLength.current = 0
      }
      if (volumeRef.current && chart) {
        try {
          chart.removeSeries(volumeRef.current)
        } catch {
          /* ignore */
        }
        volumeRef.current = null
        prevVolumeLength.current = 0
      }
    }
  }, [chart, candleRef, volumeRef, colors.upColor, colors.downColor, volumeColor, volumeBackground])

  // テーマ変更時のオプション更新
  useEffect(() => {
    candleRef.current?.applyOptions({
      upColor: colors.upColor,
      downColor: colors.downColor,
      wickUpColor: colors.upColor,
      wickDownColor: colors.downColor,
      borderVisible: false,
    })
    volumeRef.current?.applyOptions({ 
      color: volumeColor,
      priceLineVisible: false,
    })
    
    // ボリュームの背景色をプライススケールに反映
    if (chart && volumeRef.current) {
      chart.priceScale('vol').applyOptions({
        borderColor: volumeBackground,
      });
    }
  }, [candleRef, volumeRef, colors.upColor, colors.downColor, volumeColor, volumeBackground, chart])

  // データ更新（シリーズ未生成ならここで生成して即データ設定する）
  useEffect(() => {
    if ((!candleRef.current || !volumeRef.current) && chart) {
      // try creating again if missing
      try {
        if (!candleRef.current && typeof (chart as any).addCandlestickSeries === 'function') {
          candleRef.current = (chart as IChartApi).addCandlestickSeries({
            upColor: colors.upColor,
            downColor: colors.downColor,
            wickUpColor: colors.upColor,
            wickDownColor: colors.downColor,
            borderVisible: false,
          });
        }
        if (!volumeRef.current && typeof (chart as any).addHistogramSeries === 'function') {
          volumeRef.current = (chart as IChartApi).addHistogramSeries({
            priceFormat: { 
              type: "volume",
              precision: 0, // 整数表示
              minMove: 0.01, // 最小変動幅
            },
            priceScaleId: "vol",
            color: volumeColor,
            base: 0,
          });
          chart.priceScale('vol').applyOptions({ 
            scaleMargins: { top: 0.7, bottom: 0 }, // 上部マージンを縮小（より多くのスペースを使用）
            visible: true, // スケールを表示
            borderVisible: true, // 境界線を表示
            borderColor: volumeBackground, // 境界色
            entireTextOnly: false, // 数値を完全に表示
            autoScale: true, // 自動スケーリング
          });
        }
      } catch {
        /* ignore */
      }
    }

    if (candleRef.current && processedCandles.length > 0) {
      const firstTime = processedCandles[0]?.time as number | undefined;
      const dataChanged = firstTime !== undefined && firstTime !== prevFirstTimeRef.current;

      if (!dataChanged && prevCandleLength.current === processedCandles.length) {
        // 最後の要素を取得
        const lastCandle = processedCandles[processedCandles.length - 1]
        
        try {
          // timeプロパティが正しい形式かチェック
          if (typeof lastCandle.time === 'object' && !(typeof lastCandle.time === 'number')) {
            // オブジェクト形式のtimeを数値に変換
            const numericTime = toNumericTime(lastCandle.time)
            // 変換されたtimeを持つ新しいオブジェクトを作成
            const safeCandle = { 
              ...lastCandle, 
              time: numericTime as UTCTimestamp 
            }
            candleRef.current.update(safeCandle)
          } else {
            // timeが既に正しい形式の場合はそのまま更新
            candleRef.current.update(lastCandle)
          }
        } catch (err) {
          logger.error('Candlestick update error:', err, { 
            candle: lastCandle,
            timeType: typeof lastCandle.time 
          })
          // エラーが発生した場合は全データの再設定で回復を試みる
          candleRef.current.setData(processedCandles)
        }
      } else {
        candleRef.current.setData(processedCandles)
      }
      prevCandleLength.current = processedCandles.length
      if (firstTime !== undefined) {
        prevFirstTimeRef.current = firstTime
      }
    }
    
    if (volumeRef.current && processedVolumes.length > 0) {
      const firstVolTime = processedVolumes[0]?.time as number | undefined;
      const volDataChanged = firstVolTime !== undefined && firstVolTime !== prevVolFirstTimeRef.current;
      if (!volDataChanged && prevVolumeLength.current === processedVolumes.length) {
        // 最後の要素を取得
        const lastVolume = processedVolumes[processedVolumes.length - 1]
        
        try {
          // timeプロパティが正しい形式かチェック
          if (typeof lastVolume.time === 'object' && !(typeof lastVolume.time === 'number')) {
            // オブジェクト形式のtimeを数値に変換
            const numericTime = toNumericTime(lastVolume.time)
            // 変換されたtimeを持つ新しいオブジェクトを作成
            const safeVolume = { 
              ...lastVolume, 
              time: numericTime as UTCTimestamp 
            }
            volumeRef.current.update(safeVolume)
          } else {
            // timeが既に正しい形式の場合はそのまま更新
            volumeRef.current.update(lastVolume)
          }
        } catch (err) {
          logger.error('Volume update error:', err, { 
            volume: lastVolume,
            timeType: typeof lastVolume.time 
          })
          // エラーが発生した場合は全データの再設定で回復を試みる
          volumeRef.current.setData(processedVolumes)
        }
      } else {
        volumeRef.current.setData(processedVolumes)
      }
      prevVolumeLength.current = processedVolumes.length
      if (firstVolTime !== undefined) {
        prevVolFirstTimeRef.current = firstVolTime
      }
    }
  }, [candleRef, volumeRef, processedCandles, processedVolumes])
}

export default useCandlestickSeries
