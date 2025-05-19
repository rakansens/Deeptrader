'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Chat from '@/components/chat/Chat';
import ChartToolbar from '@/components/chart/ChartToolbar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pencil } from 'lucide-react';

const CandlestickChart = dynamic(() => import('@/components/chart/CandlestickChart'), {
  ssr: false,
});

export default function Home() {
  const [timeframe, setTimeframe] = useState('1h');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [indicators, setIndicators] = useState<{ ma: boolean; rsi: boolean; macd?: boolean; boll?: boolean }>({ ma: true, rsi: false, macd: false, boll: false });
  const [drawingEnabled, setDrawingEnabled] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 overflow-hidden"
        onLayout={() => window.dispatchEvent(new Event('resize'))}
      >
        <ResizablePanel defaultSize={30} minSize={20} className="border-r">
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
                    onTimeframeChange={setTimeframe}
                    symbol={symbol}
                    onSymbolChange={setSymbol}
                    indicators={indicators}
                    onIndicatorsChange={setIndicators}
                    drawingEnabled={drawingEnabled}
                    onDrawingEnabledChange={setDrawingEnabled}
                  />
                </CardHeader>
                <CardContent>
                  {drawingEnabled && (
                    <div className="mb-4 bg-muted/50 border p-3 rounded-md flex items-center">
                      <Pencil className="h-4 w-4 mr-2" />
                      <p className="text-sm">
                        描画モードが有効です。チャート上でクリック＆ドラッグして線を描画できます。
                      </p>
                    </div>
                  )}
                  <div className="w-full relative">
                    <CandlestickChart
                      height={600}
                      indicators={indicators}
                      interval={timeframe}
                      symbol={symbol}
                      onIndicatorsChange={setIndicators}
                      drawingEnabled={drawingEnabled}
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
  );
}
