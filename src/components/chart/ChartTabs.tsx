"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
const CandlestickChart = dynamic(() => import("./CandlestickChart"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[600px]" />,
});
import { Plus, X } from "lucide-react";
import {
  SYMBOLS,
  type SymbolValue,
  type Timeframe,
} from "@/constants/chart";
import type {
  IndicatorOptions,
  IndicatorsChangeHandler,
} from "@/types/chart";
import type { IndicatorSettings } from "@/constants/chart";

interface TabInfo {
  id: string;
  symbol: SymbolValue;
}

interface ChartTabsProps {
  symbol: SymbolValue;
  onSymbolChange: (symbol: SymbolValue) => void;
  timeframe: Timeframe;
  indicators: IndicatorOptions;
  onIndicatorsChange?: IndicatorsChangeHandler;
  settings: IndicatorSettings;
  drawingColor: string;
  onDrawingColorChange?: (color: string) => void;
  onPriceInfoUpdate?: (info: {
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
  }) => void;
  showOrderBook?: boolean;
  onOrderBookToggle?: () => void;
  height?: number;
}

export default function ChartTabs({
  symbol,
  onSymbolChange,
  timeframe,
  indicators,
  onIndicatorsChange,
  settings,
  drawingColor,
  onDrawingColorChange,
  onPriceInfoUpdate,
  showOrderBook = false,
  onOrderBookToggle,
  height = 800,
}: ChartTabsProps) {
  const [tabs, setTabs] = useState<TabInfo[]>([
    { id: "tab-0", symbol },
  ]);
  const [activeTab, setActiveTab] = useState<string>("tab-0");

  // sync symbol prop with active tab
  useEffect(() => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab ? { ...t, symbol } : t)),
    );
  }, [symbol, activeTab]);

  const addTab = () => {
    const id = `tab-${Date.now()}`;
    const newTab = { id, symbol: SYMBOLS[0].value };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(id);
    onSymbolChange(newTab.symbol);
  };

  const removeTab = (id: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) {
        const fallback = { id: "tab-0", symbol: SYMBOLS[0].value };
        setActiveTab(fallback.id);
        onSymbolChange(fallback.symbol);
        return [fallback];
      }
      if (activeTab === id) {
        const newActive = filtered[0];
        setActiveTab(newActive.id);
        onSymbolChange(newActive.symbol);
      }
      return filtered;
    });
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    const tab = tabs.find((t) => t.id === id);
    if (tab) onSymbolChange(tab.symbol);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="mb-2 flex items-center">
        {tabs.map((tab) => (
          <div key={tab.id} className="relative mr-2 flex items-center">
            <TabsTrigger value={tab.id} className="pr-4">
              {tab.symbol}
            </TabsTrigger>
            <button
              aria-label="Close tab"
              className="absolute right-0 top-0 h-full px-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                removeTab(tab.id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          aria-label="Add tab"
          onClick={addTab}
          className="ml-auto rounded px-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="w-full">
          <CandlestickChart
            symbol={tab.symbol}
            interval={timeframe}
            indicators={indicators}
            onIndicatorsChange={onIndicatorsChange}
            indicatorSettings={settings}
            drawingColor={drawingColor}
            onDrawingColorChange={onDrawingColorChange}
            onPriceInfoUpdate={onPriceInfoUpdate}
            showOrderBook={showOrderBook}
            onOrderBookToggle={onOrderBookToggle}
            height={height}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

