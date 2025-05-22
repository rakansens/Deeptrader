"use client";
import { useState } from "react";
import IndicatorPanel from "./IndicatorPanel";
import useOrderBook from "@/hooks/chart/use-order-book";
import { cn } from "@/lib/utils";
import type { SymbolValue } from "@/constants/chart";
import { ChevronDown } from "lucide-react";

// 表示モード
type ViewMode = "both" | "bids" | "asks";

interface OrderBookPanelProps {
  symbol: SymbolValue;
  height: number | "auto";
  currentPrice?: number;
  onClose?: () => void;
  className?: string;
}

export default function OrderBookPanel({
  symbol,
  height,
  currentPrice,
  onClose,
  className,
}: OrderBookPanelProps) {
  const { bids, asks } = useOrderBook(symbol);
  const [viewMode, setViewMode] = useState<ViewMode>("both");

  const isCurrent = (price: number) =>
    currentPrice !== undefined && Math.abs(price - currentPrice) < 1e-6;

  // 表示数を増やす（30行まで表示）
  const maxRows = 30;
  const reversedAsks = [...asks].reverse().slice(0, maxRows);
  const limitedBids = bids.slice(0, maxRows);

  // 数値を適切にフォーマット
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatQuantity = (qty: number) => {
    return qty < 0.001 ? qty.toFixed(5) : qty.toFixed(5);
  };

  const formatTotal = (total: number) => {
    if (total >= 1000) {
      return `${(total / 1000).toFixed(2)}K`;
    } else {
      return total.toFixed(5);
    }
  };

  // 背景色の透明度を数量に基づいて計算（最大値を基準に）
  const maxAsksQty = Math.max(...reversedAsks.map(a => a.quantity));
  const maxBidsQty = Math.max(...limitedBids.map(b => b.quantity));

  const getOpacity = (quantity: number, isAsk: boolean) => {
    const maxQty = isAsk ? maxAsksQty : maxBidsQty;
    const opacity = Math.min(0.6, Math.max(0.05, quantity / maxQty * 0.6));
    return opacity;
  };

  return (
    <IndicatorPanel
      title="オーダーブック"
      height={height}
      onClose={onClose}
      className={className}
    >
      <div className="flex items-center justify-between border-b border-border h-8 px-2 text-xs">
        <div className="flex gap-2">
          <button
            className={cn(
              "p-1 rounded hover:bg-accent/50",
              viewMode === "bids" && "bg-accent/50"
            )}
            onClick={() => setViewMode("bids")}
            title="買い注文のみ表示"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <span className="text-green-500 text-[10px]">□</span>
            </div>
          </button>
          <button
            className={cn(
              "p-1 rounded hover:bg-accent/50",
              viewMode === "asks" && "bg-accent/50"
            )}
            onClick={() => setViewMode("asks")}
            title="売り注文のみ表示"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <span className="text-red-500 text-[10px]">□</span>
            </div>
          </button>
          <button
            className={cn(
              "p-1 rounded hover:bg-accent/50",
              viewMode === "both" && "bg-accent/50"
            )}
            onClick={() => setViewMode("both")}
            title="両方表示"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <span className="flex flex-col">
                <span className="text-red-500 text-[7px] leading-[7px]">□</span>
                <span className="text-green-500 text-[7px] leading-[7px]">□</span>
              </span>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span>0.01</span>
          <ChevronDown className="h-3 w-3" />
        </div>
      </div>
      <div className="flex flex-col h-full">
        {/* ヘッダー（固定） */}
        <div className="w-full grid grid-cols-3 text-xs text-muted-foreground py-1 border-b border-border sticky top-0 bg-background z-10">
          <div className="text-left pl-2">価格 (USDT)</div>
          <div className="text-right">金額 (BTC)</div>
          <div className="text-right pr-2">建値合計額</div>
        </div>
        
        {/* スクロール可能なコンテンツエリア */}
        <div className="overflow-auto flex-1 font-mono-trading text-xs">
          {(viewMode === "both" || viewMode === "asks") && (
            <div className="w-full">
              {reversedAsks.map((a, i) => {
                const total = a.price * a.quantity;
                const bgOpacity = getOpacity(a.quantity, true);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-3 py-0.5",
                      isCurrent(a.price) && "bg-accent/30"
                    )}
                    style={{
                      backgroundColor: isCurrent(a.price) ? "" : `rgba(220, 53, 69, ${bgOpacity})`,
                    }}
                  >
                    <div className="text-left pl-2 text-red-500">{formatPrice(a.price)}</div>
                    <div className="text-right">{formatQuantity(a.quantity)}</div>
                    <div className="text-right pr-2">{formatTotal(total)}</div>
                  </div>
                );
              })}
            </div>
          )}
          
          {currentPrice !== undefined && (
            <div
              className="py-2 text-center font-bold text-lg border-y border-border"
            >
              <span className="text-red-500">{currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              <span className="text-xs ml-1 text-muted-foreground">${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          
          {(viewMode === "both" || viewMode === "bids") && (
            <div className="w-full">
              {limitedBids.map((b, i) => {
                const total = b.price * b.quantity;
                const bgOpacity = getOpacity(b.quantity, false);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-3 py-0.5",
                      isCurrent(b.price) && "bg-accent/30"
                    )}
                    style={{
                      backgroundColor: isCurrent(b.price) ? "" : `rgba(40, 167, 69, ${bgOpacity})`,
                    }}
                  >
                    <div className="text-left pl-2 text-green-500">{formatPrice(b.price)}</div>
                    <div className="text-right">{formatQuantity(b.quantity)}</div>
                    <div className="text-right pr-2">{formatTotal(total)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* 下部バー（固定） */}
        <div className="border-t border-border py-1 px-2 flex items-center text-xs sticky bottom-0 bg-background">
          <span className="text-green-500 font-semibold">B 54.51%</span>
          <div className="flex-1 mx-2 h-1.5 rounded-full overflow-hidden bg-red-500">
            <div className="h-full bg-green-500" style={{ width: '54.51%' }}></div>
          </div>
          <span className="text-red-500 font-semibold">45.49% S</span>
        </div>
      </div>
    </IndicatorPanel>
  );
}

