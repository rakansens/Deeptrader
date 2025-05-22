'use client';

import { useMemo } from 'react';
import type { HistogramData, CandlestickData } from 'lightweight-charts';
import { cn } from '@/lib/utils';

interface VolumeInfoProps {
  volumes: HistogramData[];
  candles?: CandlestickData[];  // ローソク足データを追加
  symbol: string;
  className?: string;
}

/**
 * 出来高情報を表示するコンポーネント
 * 参考画像のように上部に取引量データを表示
 */
export default function VolumeInfo({ volumes, candles = [], symbol, className }: VolumeInfoProps) {
  // 通貨ペアからベース通貨とクォート通貨を抽出（例: BTCUSDT → BTC, USDT）
  const baseCurrency = useMemo(() => {
    // BTCUSDTのようなフォーマットを想定
    if (symbol.includes('USDT')) {
      return symbol.replace('USDT', '');
    }
    // その他のフォーマットの場合はデフォルトでBTC
    return 'BTC';
  }, [symbol]);

  // 出来高データの集計
  const volumeStats = useMemo(() => {
    if (!volumes || volumes.length === 0) {
      return { btcVol: 0, usdtVol: 0, buyVol: 0, sellVol: 0 };
    }

    // 直近24時間分の出来高を集計（24時間分のデータがない場合は全てを使用）
    const recentVolumes = volumes.slice(-144); // 1分足なら144=24時間
    
    // BTC単位の出来高 (数量の合計)
    const btcVol = recentVolumes.reduce((sum, vol) => sum + vol.value, 0);
    
    // 最新の価格を取得
    const latestPrice = candles.length > 0 
      ? candles[candles.length - 1].close 
      : 100000; // デフォルト値
    
    // USDT単位の出来高（最新価格で概算）
    const usdtVol = btcVol * latestPrice;
    
    // 買い・売りの出来高
    // 実際には各ボリュームバーが買いか売りかの情報を持っている必要があるが、
    // そのデータがなければ、ローソク足が上昇か下降かでカラーを割り当てると仮定
    const buyVol = btcVol * 0.55; // ダミーデータ（実際は正確なデータを使用）
    const sellVol = btcVol * 0.45; // ダミーデータ（実際は正確なデータを使用）
    
    return { btcVol, usdtVol, buyVol, sellVol };
  }, [volumes, candles]);

  // 数値のフォーマット関数
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(3) + 'B';
    } else if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(3) + 'M';
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(3) + 'K';
    } else {
      return num.toFixed(3);
    }
  };

  return (
    <div className={cn("flex items-center gap-2 text-xs font-mono-trading", className)}>
      <span className="text-muted-foreground">
        Vol({baseCurrency}):
      </span>
      <span className="font-semibold">{formatNumber(volumeStats.btcVol)}</span>
      
      <span className="text-muted-foreground pl-2">
        Vol(USDT):
      </span>
      <span className="font-semibold">{formatNumber(volumeStats.usdtVol)}</span>
      
      {/* 買い出来高（緑色表示） */}
      <span className="text-success font-semibold pl-2">
        {formatNumber(volumeStats.buyVol)}
      </span>
      
      {/* 売り出来高（赤色表示） */}
      <span className="text-error font-semibold">
        {formatNumber(volumeStats.sellVol)}
      </span>
    </div>
  );
} 