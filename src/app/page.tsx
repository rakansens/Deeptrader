'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Chat from '@/components/chat/Chat';
import ChartToolbar from '@/components/chart/ChartToolbar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const CandlestickChart = dynamic(() => import('@/components/chart/CandlestickChart'), {
  ssr: false,
});

const RSIChart = dynamic(() => import('@/components/chart/RSIChart'), {
  ssr: false,
});

const MACDChart = dynamic(() => import('@/components/chart/MACDChart'), {
  ssr: false,
});

export default function Home() {
  const [timeframe, setTimeframe] = useState('1h');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [indicators, setIndicators] = useState<{ ma: boolean; rsi: boolean; macd?: boolean; boll?: boolean }>({ ma: true, rsi: false, macd: false, boll: false });

  // インジケーターの表示・非表示を切り替える関数
  const toggleIndicator = (name: keyof typeof indicators) => {
    setIndicators(prev => ({ ...prev, [name]: !prev[name] }));
  };

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
                  />
                </CardHeader>
                <CardContent>
                  <div className="w-full">
                    <CandlestickChart
                      height={600}
                      indicators={indicators}
                      interval={timeframe}
                      symbol={symbol}
                      onIndicatorsChange={setIndicators}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* インジケーターパネル */}
              {(indicators.rsi || indicators.macd) && (
                <div className="grid gap-4 mb-6">
                  {indicators.rsi && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>RSIインジケーター</CardTitle>
                        <CardDescription>相対力指数（Relative Strength Index）</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RSIChart
                          symbol={symbol}
                          interval={timeframe}
                          height={150}
                        />
                      </CardContent>
                    </Card>
                  )}
                  
                  {indicators.macd && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>MACDインジケーター</CardTitle>
                        <CardDescription>移動平均収束拡散指標（Moving Average Convergence Divergence）</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <MACDChart
                          symbol={symbol}
                          interval={timeframe}
                          height={150}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
