'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Waves,
  Settings,
  TriangleRight,
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

import IndicatorSettingsDropdown from "./IndicatorSettingsModal";
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
}

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
}: ChartToolbarProps) {
  const [showIndicatorSettings, setShowIndicatorSettings] = useState(false);
  const isPriceUp = priceChange >= 0;
  
  const symbolObj = SYMBOLS.find((s) => s.value === symbol) || SYMBOLS[0];

  return (
    <div className="flex flex-col w-full space-y-2">
      {/* 上部バー: シンボル、現在価格、変化率 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="font-bold text-lg px-2 py-1">
                {symbolObj.label} <TriangleRight className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>通貨ペア</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SYMBOLS.map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={() => onSymbolChange(s.value)}
                  className={s.value === symbol ? "bg-accent" : ""}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
      
      {/* 下部バー: タイムフレーム選択 */}
      <div className="flex items-center justify-between border-b pb-2">
        <Tabs
          value={timeframe}
          onValueChange={(value) => onTimeframeChange(value as Timeframe)}
          className="w-full"
        >
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto">
            {TIMEFRAMES.map((tf) => (
              <TabsTrigger
                key={tf}
                value={tf}
                className={`
                  text-xs px-3 py-1.5 h-auto rounded-md font-medium
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                  data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground
                  data-[state=inactive]:hover:bg-muted/50
                `}
              >
                {tf}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className={`p-1 h-8 w-8 ${indicators.ma ? "bg-muted" : ""}`}
            onClick={() => onIndicatorsChange({ ...indicators, ma: !indicators.ma })}
            title="移動平均線"
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`p-1 h-8 w-8 ${indicators.boll ? "bg-muted" : ""}`}
            onClick={() => onIndicatorsChange({ ...indicators, boll: !indicators.boll })}
            title="ボリンジャーバンド"
          >
            <Waves className="h-4 w-4" />
          </Button>
          
          <IndicatorSettingsDropdown
            settings={settings}
            onSettingsChange={onSettingsChange}
            open={showIndicatorSettings}
            onOpenChange={setShowIndicatorSettings}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="p-1 h-8 w-8"
                title="指標設定"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </IndicatorSettingsDropdown>
        </div>
      </div>
    </div>
  );
}
