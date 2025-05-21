'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { UiControlProvider } from '@/contexts/UiControlContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Chat from '@/components/chat/Chat';
import ChartToolbar from '@/components/chart/ChartToolbar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import {
  TIMEFRAMES,
  SYMBOLS,
  type Timeframe,
  type SymbolValue,
} from '@/constants/chart';
import { DEFAULT_INDICATOR_SETTINGS } from '@/constants/chart';
import type { IndicatorSettings } from '@/types/chart';

const CandlestickChart = dynamic(() => import('@/components/chart/CandlestickChart'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[600px]" />,
});

// 描画色のオプション
const DRAWING_COLORS = [
  { value: '#ef4444', label: '赤', class: 'bg-red-500' },
  { value: '#3b82f6', label: '青', class: 'bg-blue-500' },
  { value: '#22c55e', label: '緑', class: 'bg-green-500' },
  { value: '#f59e0b', label: '橙', class: 'bg-amber-500' },
  { value: '#a855f7', label: '紫', class: 'bg-purple-500' },
];

export default function Home() {
  const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES[3]);
  const [symbol, setSymbol] = useState<SymbolValue>(SYMBOLS[0].value);
  const [indicators, setIndicators] = useState<{ ma: boolean; rsi: boolean; macd?: boolean; boll?: boolean }>({ ma: true, rsi: false, macd: false, boll: false });
  const [settings, setSettings] = useState<IndicatorSettings>(DEFAULT_INDICATOR_SETTINGS);
  const [drawingColor, setDrawingColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('drawingColor') ?? DRAWING_COLORS[0].value;
    }
    return DRAWING_COLORS[0].value;
  });
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const handleDrawingColorChange = (value: string) => {
    setDrawingColor(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('drawingColor', value);
    }
  };

  // 型安全なハンドラー関数を定義
  const handleTimeframeChange = (tf: Timeframe) => setTimeframe(tf);
  const handleSymbolChange = (sym: SymbolValue) => setSymbol(sym);

  const toggleIndicator = (indicatorName: string, enable?: boolean) => {
    setIndicators(prevIndicators => {
      const key = indicatorName.toLowerCase() as keyof typeof prevIndicators;
      if (key === 'ma' || key === 'rsi' || key === 'macd' || key === 'boll') {
        const currentIndicatorState = prevIndicators[key];
        return {
          ...prevIndicators,
          [key]: typeof enable === 'boolean' ? enable : !currentIndicatorState,
        };
      }
      console.warn(`Unknown indicator: ${indicatorName}`);
      return prevIndicators;
    });
  };


  useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenModal) {
      setShowWelcomeModal(true);
    }
  }, []); // Empty dependency array to run only on mount

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('hasSeenWelcomeModal', 'true');
  };

  return (
    <UiControlProvider value={{ toggleIndicator, changeTimeframe: handleTimeframeChange }}>
      <div className="flex min-h-screen flex-col">
      {showWelcomeModal && (
        <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>DeepTrader AIへようこそ！</DialogTitle>
              <DialogDescription>
                あなたのパーソナル取引アシスタントです。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <p>
                左側のチャットを使って、AIに質問したり、市場分析を依頼したり、チャートの表示を操作することができます。(例: 「RSIインジケーターを表示して」)
              </p>
              <p>
                右側のチャートでは市場データをリアルタイムで確認できます。チャート上のツールバーで通貨ペアや時間足を変更できます。
              </p>
              <p>
                まずは気軽に話しかけてみてください！
              </p>
            </div>
            <DialogFooter className="sm:justify-end">
              <Button type="button" onClick={handleCloseWelcomeModal}>
                使ってみる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <Navbar />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 overflow-hidden"
        onLayout={() => window.dispatchEvent(new Event('resize'))}
      >
        <ResizablePanel defaultSize={40} minSize={20} className="border-r">
          <div className="flex flex-col h-[calc(100vh-3.5rem)]">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">AIアシスタント</h2>
              <p className="text-sm text-muted-foreground">
                トレーディングや市場分析に関して質問してください
              </p>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              <Chat />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel minSize={40}>
          <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-auto">
            <div className="p-4 md:p-6">
              <h1 className="text-2xl font-bold tracking-tight mb-2">市場分析ダッシュボード</h1>
              <p className="text-muted-foreground mb-4">
                リアルタイムチャートと市場情報
              </p>
              
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle>{symbol} リアルタイムチャート</CardTitle>
                  <CardDescription>
                    {symbol}の価格変動をリアルタイムで監視します
                  </CardDescription>
                  <ChartToolbar
                    timeframe={timeframe}
                    onTimeframeChange={handleTimeframeChange}
                    symbol={symbol}
                    onSymbolChange={handleSymbolChange}
                    indicators={indicators}
                    onIndicatorsChange={setIndicators}
                    settings={settings}
                    onSettingsChange={setSettings}
                  />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-muted-foreground">描画色:</span>
                    {DRAWING_COLORS.map((c) => (
                      <button
                        key={c.value}
                        title={c.label}
                        onClick={() => handleDrawingColorChange(c.value)}
                        className={`w-6 h-6 rounded-full ${c.class} border border-border transition-all ${
                          drawingColor === c.value
                            ? 'ring-2 ring-offset-1 ring-primary'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        aria-label={`色を${c.label}に変更`}
                      />
                    ))}
                  </div>
                  <div className="w-full relative">
                    <CandlestickChart
                      height={600}
                      indicators={indicators}
                      interval={timeframe}
                      symbol={symbol}
                      onIndicatorsChange={setIndicators}
                      indicatorSettings={settings}
                      drawingColor={drawingColor}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Note: RSIとMACDパネルはCandlestickChartコンポーネント内で表示されるため、ここでは表示しません */}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
    </UiControlProvider>
  );
}
