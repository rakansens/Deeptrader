'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Waves,
  Settings,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import IndicatorSettingsDropdown from "./IndicatorSettingsModal";
import TimeframeDropdown from "./TimeframeDropdown";
import OrderBookToggleButton from "./orderbook-toggle-button";
import OrderBookPanel from "./OrderBookPanel";
import OrderBookHoverCard from "./OrderBookHoverCard";
import {
  SYMBOLS,
  TIMEFRAMES,
  type SymbolValue,
  type Timeframe,
} from "@/constants/chart";
import type { IndicatorOptions, IndicatorsChangeHandler } from "@/types/chart";
import type { IndicatorSettings } from "@/constants/chart";

interface ChartToolbarProps {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  symbol: SymbolValue;
  onSymbolChange: (symbol: SymbolValue) => void;
  indicators: IndicatorOptions;
  onIndicatorsChange: IndicatorsChangeHandler;
  settings: IndicatorSettings;
  onSettingsChange: (settings: IndicatorSettings) => void;
  latestPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  showOrderBook?: boolean;
  onOrderBookToggle?: () => void;
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
}

// 利用可能なすべてのタイムフレーム
const ALL_TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'] as const;
// デフォルトで表示するタイムフレーム
const DEFAULT_DISPLAY_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

export default function ChartToolbar({
  timeframe,
  onTimeframeChange,
  symbol,
  onSymbolChange,
  indicators,
  onIndicatorsChange,
  settings,
  onSettingsChange,
  latestPrice,
  priceChange = 0,
  priceChangePercent = 0,
  showOrderBook = false,
  onOrderBookToggle = () => {},
  ohlc,
  maValues,
}: ChartToolbarProps) {
  const [displayTimeframes, setDisplayTimeframes] = useState<string[]>(DEFAULT_DISPLAY_TIMEFRAMES);
  const isPriceUp = priceChange >= 0;
  
  const symbolObj = SYMBOLS.find((s) => s.value === symbol) || SYMBOLS[0];

  const handleTimeframeVisibilityChange = (tf: string, isVisible: boolean) => {
    if (isVisible && !displayTimeframes.includes(tf)) {
      const newTimeframes = [...displayTimeframes, tf];
      newTimeframes.sort((a, b) => {
        return ALL_TIMEFRAMES.indexOf(a as any) - ALL_TIMEFRAMES.indexOf(b as any);
      });
      setDisplayTimeframes(newTimeframes);
    } else if (!isVisible && displayTimeframes.includes(tf)) {
      setDisplayTimeframes(displayTimeframes.filter(item => item !== tf));
    }
  };

  return (
    <div className="flex flex-col w-full space-y-2">
      {/* 上部バー: シンボル、現在価格、変化率 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <Button variant="ghost" className="font-bold text-lg px-2 py-1">
                {symbolObj.label}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-[200px]" align="start">
              <h3 className="text-sm font-medium mb-2">通貨ペア</h3>
              <div className="space-y-1">
                {SYMBOLS.map((s) => (
                  <Button
                    key={s.value}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start px-2 py-1 h-7 text-xs",
                      s.value === symbol && "bg-accent"
                    )}
                    onClick={() => onSymbolChange(s.value)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        
        {latestPrice && (
          <div className="flex items-center space-x-4">
            <span className="text-lg font-semibold">
              {latestPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <div className={`flex items-center ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
              <span className="font-semibold mr-1">
                {isPriceUp ? '+' : ''}{priceChange.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-sm">
                ({isPriceUp ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </span>
              {isPriceUp 
                ? <ArrowUpRight className="h-4 w-4 ml-1" /> 
                : <ArrowDownRight className="h-4 w-4 ml-1" />
              }
            </div>
          </div>
        )}
      </div>

      {/* OHLC情報表示セクション */}
      {ohlc && (
        <div className="flex items-center text-xs border-b border-border pb-1 space-x-3 overflow-x-auto">
          <div className="flex items-center">
            <span className="opacity-70 mr-1">{ohlc.time}</span>
          </div>
          <div className="flex items-center">
            <span className="opacity-70 mr-1">始値:</span>
            <span className="font-medium">{ohlc.open.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <div className="flex items-center text-green-500">
            <span className="opacity-70 mr-1">高値:</span> 
            <span className="font-medium">{ohlc.high.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <div className="flex items-center text-red-500">
            <span className="opacity-70 mr-1">安値:</span>
            <span className="font-medium">{ohlc.low.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <div className="flex items-center">
            <span className="opacity-70 mr-1">終値:</span>
            <span className="font-medium">{ohlc.close.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <div className="flex items-center">
            <span className="opacity-70 mr-1">変動率:</span>
            <span className={`font-medium ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
              {isPriceUp ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
          {/* アンプリチュード (高値と安値の差の割合) */}
          <div className="flex items-center">
            <span className="opacity-70 mr-1">アンプリチュード:</span>
            <span className="font-medium">
              {((ohlc.high - ohlc.low) / ohlc.low * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* インジケーター情報表示セクション */}
      <div className="flex items-center text-xs mb-1 space-x-3 overflow-x-auto">
        {/* 移動平均線情報表示 */}
        {maValues && indicators.ma && (
          <>
            <span className="opacity-80">
              MA(7): <span className="text-yellow-400 font-medium">{maValues.ma7?.toFixed(2) || '—'}</span>
            </span>
            <span className="opacity-80">
              MA(25): <span className="text-pink-400 font-medium">{maValues.ma25?.toFixed(2) || '—'}</span>
            </span>
            <span className="opacity-80">
              MA(99): <span className="text-blue-400 font-medium">{maValues.ma99?.toFixed(2) || '—'}</span>
            </span>
          </>
        )}
        
        {/* ボリンジャーバンド情報表示 - 有効な場合のみ表示 */}
        {indicators.boll && ohlc && (
          <>
            <span className="opacity-80 ml-2 pl-2 border-l border-border">
              ボリバン: <span className="text-purple-400 font-medium">期間 {settings.boll?.period || 20}</span>
            </span>
            <span className="opacity-80">
              標準偏差: <span className="text-purple-400 font-medium">{settings.boll?.stdDev || 2}</span>
            </span>
          </>
        )}
      </div>
      
      {/* 下部バー: タイムフレーム選択 */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-1">
          {/* 表示中のタイムフレーム */}
          {displayTimeframes.map((tf) => (
            <Button
              key={tf}
              variant={tf === timeframe ? "default" : "ghost"}
              size="sm"
              className={`text-xs px-2 py-1 h-7 ${tf === timeframe ? "text-black font-medium" : ""}`}
              onClick={() => onTimeframeChange(tf as Timeframe)}
            >
              {tf}
            </Button>
          ))}
          
          {/* 追加のタイムフレーム選択 */}
          <TimeframeDropdown 
            timeframe={timeframe} 
            onTimeframeChange={onTimeframeChange}
            displayTimeframes={displayTimeframes}
            onDisplayChange={handleTimeframeVisibilityChange}
            allTimeframes={ALL_TIMEFRAMES as readonly string[]}
          />
        </div>
        
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-1 h-7 ${indicators.ma ? "bg-muted" : ""}`}
                  onClick={() => onIndicatorsChange({ ...indicators, ma: !indicators.ma })}
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs py-1 px-2">
                <p>移動平均線 (MA)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-1 h-7 ${indicators.boll ? "bg-muted" : ""}`}
                  onClick={() => onIndicatorsChange({ ...indicators, boll: !indicators.boll })}
                >
                  <Waves className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs py-1 px-2">
                <p>ボリンジャーバンド (BB)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* オーダーブックボタン - 専用コンポーネント */}
          <OrderBookHoverCard 
            symbol={symbol}
            currentPrice={latestPrice}
            showOrderBook={showOrderBook}
            onOrderBookToggle={onOrderBookToggle}
          />
          
          <IndicatorSettingsDropdown
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        </div>
      </div>
    </div>
  );
}
