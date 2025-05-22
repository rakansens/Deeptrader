"use client";

import { useState, useEffect, useCallback } from "react";
import { UiControlProvider } from "@/contexts/UiControlContext";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Chat from "@/components/chat/Chat";
import ChartToolbar from "@/components/chart/ChartToolbar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { logger } from "@/lib/logger";
import {
  TIMEFRAMES,
  SYMBOLS,
  DRAWING_COLORS,
  type Timeframe,
  type SymbolValue,
} from "@/constants/chart";
import { DEFAULT_INDICATOR_SETTINGS } from "@/constants/chart";
import type { IndicatorSettings } from "@/constants/chart";
import ChartTabs from "@/components/chart/ChartTabs";


export default function Home() {
  const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES[3]);
  const [symbol, setSymbol] = useState<SymbolValue>(SYMBOLS[0].value);
  const [indicators, setIndicators] = useState<{
    ma: boolean;
    rsi: boolean;
    macd?: boolean;
    boll?: boolean;
  }>({ ma: true, rsi: true, macd: true, boll: false });
  const [settings, setSettings] = useState<IndicatorSettings>(
    DEFAULT_INDICATOR_SETTINGS,
  );
  const [drawingColor, setDrawingColor] = useState<string>(
    DRAWING_COLORS[0].value,
  );
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  // オーダーブックの表示状態
  const [showOrderBook, setShowOrderBook] = useState(false);
  // 価格情報を保持するための状態
  const [priceInfo, setPriceInfo] = useState<{
    currentPrice?: number;
    priceChange?: number;
    priceChangePercent?: number;
    ohlc?: {
      open: number;
      high: number;
      low: number;
      close: number;
      time: string;
    };
    maValues?: {
      ma7?: number;
      ma25?: number;
      ma99?: number;
    };
  }>({});

  // クライアントサイドでのみ実行する初期化
  useEffect(() => {
    // ローカルストレージからの読み込みはクライアントサイドでのみ行う
    const savedColor = localStorage.getItem("drawingColor");
    if (savedColor) {
      setDrawingColor(savedColor);
    }
  }, []);

  const handleDrawingColorChange = useCallback((value: string) => {
    setDrawingColor(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("drawingColor", value);
    }
  }, []);

  // 型安全なハンドラー関数を定義
  const handleTimeframeChange = useCallback(
    (timeframe: Timeframe) => setTimeframe(timeframe),
    [],
  );
  const handleSymbolChange = useCallback(
    (sym: SymbolValue) => setSymbol(sym),
    [],
  );

  const toggleIndicator = useCallback(
    (indicatorName: string, enable?: boolean) => {
      setIndicators((prevIndicators) => {
        const key = indicatorName.toLowerCase() as keyof typeof prevIndicators;
        if (key === "ma" || key === "rsi" || key === "macd" || key === "boll") {
          const currentIndicatorState = prevIndicators[key];
          return {
            ...prevIndicators,
            [key]:
              typeof enable === "boolean" ? enable : !currentIndicatorState,
          };
        }
        logger.warn(`Unknown indicator: ${indicatorName}`);
        return prevIndicators;
      });
    },
    [],
  );

  // 価格情報を更新するためのコールバック
  const handlePriceInfoUpdate = useCallback((info: {
    currentPrice?: number;
    priceChange?: number;
    priceChangePercent?: number;
  }) => {
    setPriceInfo(info);
  }, []);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem("hasSeenWelcomeModal");
    if (!hasSeenModal) {
      setShowWelcomeModal(true);
    }
  }, []); // Empty dependency array to run only on mount

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasSeenWelcomeModal", "true");
  };

  // オーダーブックの表示/非表示を切り替える
  const handleOrderBookToggle = useCallback(() => {
    setShowOrderBook(prev => !prev);
  }, []);

  return (
    <UiControlProvider
      value={{ toggleIndicator, changeTimeframe: handleTimeframeChange }}
    >
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
                  左側のチャットを使って、AIに質問したり、市場分析を依頼したり、チャートの表示を操作することができます。(例:
                  「RSIインジケーターを表示して」)
                </p>
                <p>
                  右側のチャートでは市場データをリアルタイムで確認できます。チャート上のツールバーで通貨ペアや時間足を変更できます。
                </p>
                <p>まずは気軽に話しかけてみてください！</p>
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
        >
          <ResizablePanel defaultSize={25} minSize={15} className="border-r">
            <div className="flex flex-col h-[calc(100vh-3.5rem)]">
              <div className="flex-1 p-4 overflow-hidden">
                <Chat symbol={symbol} timeframe={timeframe} />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle className="w-[2px] bg-border hover:bg-primary/50 transition-colors" />
          <ResizablePanel minSize={50}>
            <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-auto">
              <div className="p-4 md:p-4">
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <ChartToolbar
                      timeframe={timeframe}
                      onTimeframeChange={handleTimeframeChange}
                      symbol={symbol}
                      onSymbolChange={handleSymbolChange}
                      indicators={indicators}
                      onIndicatorsChange={setIndicators}
                      settings={settings}
                      onSettingsChange={setSettings}
                      latestPrice={priceInfo.currentPrice}
                      priceChange={priceInfo.priceChange}
                      priceChangePercent={priceInfo.priceChangePercent}
                      showOrderBook={showOrderBook}
                      onOrderBookToggle={handleOrderBookToggle}
                      ohlc={priceInfo.ohlc}
                      maValues={priceInfo.maValues}
                    />
                  </CardHeader>
                  <CardContent>
                    {/* 描画色選択はサイドバーに移動 */}
                    <div className="w-full relative">
                      <ChartTabs
                        symbol={symbol}
                        onSymbolChange={handleSymbolChange}
                        timeframe={timeframe}
                        indicators={indicators}
                        onIndicatorsChange={setIndicators}
                        settings={settings}
                        drawingColor={drawingColor}
                        onDrawingColorChange={handleDrawingColorChange}
                        onPriceInfoUpdate={handlePriceInfoUpdate}
                        showOrderBook={showOrderBook}
                        onOrderBookToggle={handleOrderBookToggle}
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
