"use client";
import { useState } from "react";
import IndicatorPanel from "./IndicatorPanel";
import useOrderBook from "@/hooks/chart/use-order-book";
import { cn } from "@/lib/utils";
import type { SymbolValue } from "@/constants/chart";
import { ChevronDown, ChevronUp } from "lucide-react";

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

  // 表示数を増やす（20行まで表示）
  const maxRows = 20;
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
      return total.toFixed(2);
    }
  };

  // 背景色の透明度を数量に基づいて計算（最大値を基準に）
  const maxAsksQty = Math.max(...reversedAsks.map(a => a.quantity), 0.0001);
  const maxBidsQty = Math.max(...limitedBids.map(b => b.quantity), 0.0001);

  const getOpacity = (quantity: number, isAsk: boolean) => {
    const maxQty = isAsk ? maxAsksQty : maxBidsQty;
    const opacity = Math.min(0.45, Math.max(0.05, quantity / maxQty * 0.5));
    return opacity;
  };

  return (
    <IndicatorPanel
      title="オーダーブック"
      height={height}
      onClose={onClose}
      className={className}
    >
      <div className="flex items-center justify-between border-b border-border/70 py-1 px-2 text-xs bg-muted/30">
        <div className="flex gap-1.5">
          <button
            className={cn(
              "px-1.5 py-0.5 rounded transition-colors",
              viewMode === "bids" ? "bg-accent/70 text-accent-foreground" : "hover:bg-accent/30"
            )}
            onClick={() => setViewMode("bids")}
            title="買い注文のみ表示"
          >
            <span className="text-green-500 font-medium">買い</span>
          </button>
          <button
            className={cn(
              "px-1.5 py-0.5 rounded transition-colors",
              viewMode === "asks" ? "bg-accent/70 text-accent-foreground" : "hover:bg-accent/30"
            )}
            onClick={() => setViewMode("asks")}
            title="売り注文のみ表示"
          >
            <span className="text-red-500 font-medium">売り</span>
          </button>
          <button
            className={cn(
              "px-1.5 py-0.5 rounded transition-colors",
              viewMode === "both" ? "bg-accent/70 text-accent-foreground" : "hover:bg-accent/30"
            )}
            onClick={() => setViewMode("both")}
            title="両方表示"
          >
            <span className="font-medium">両方</span>
          </button>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
          <span>精度: 0.01</span>
          <ChevronDown className="h-3 w-3" />
        </div>
      </div>
      <div className="flex flex-col h-full">
        {/* ヘッダー（固定） */}
        <div className="w-full grid grid-cols-3 text-[10px] text-muted-foreground py-1 px-2 border-b border-border/70 sticky top-0 bg-background z-10">
          <div className="text-left">価格 (USDT)</div>
          <div className="text-right">数量 (BTC)</div>
          <div className="text-right">合計</div>
        </div>
        
        {/* スクロール可能なコンテンツエリア */}
        <div className="overflow-auto flex-1 font-mono text-[11px] overscroll-contain">
          {(viewMode === "both" || viewMode === "asks") && (
            <div className="w-full">
              {reversedAsks.map((a, i) => {
                const total = a.price * a.quantity;
                const bgOpacity = getOpacity(a.quantity, true);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-3 py-[2px] px-2 border-b border-border/10",
                      isCurrent(a.price) && "bg-accent/30"
                    )}
                    style={{
                      backgroundColor: isCurrent(a.price) ? "" : `rgba(220, 53, 69, ${bgOpacity})`,
                    }}
                  >
                    <div className="text-left text-red-500">{formatPrice(a.price)}</div>
                    <div className="text-right">{formatQuantity(a.quantity)}</div>
                    <div className="text-right text-muted-foreground">{formatTotal(total)}</div>
                  </div>
                );
              })}
            </div>
          )}
          
          {currentPrice !== undefined && (
            <div
              className="py-1.5 flex items-center justify-between px-2 border-y border-primary/30 bg-primary/5"
            >
              <div className="flex items-center">
                <ChevronUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-primary-foreground font-semibold">現在価格</span>
              </div>
              <div>
                <span className="font-semibold">{currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                <span className="text-[10px] ml-1 text-muted-foreground">USDT</span>
              </div>
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
                      "grid grid-cols-3 py-[2px] px-2 border-b border-border/10",
                      isCurrent(b.price) && "bg-accent/30"
                    )}
                    style={{
                      backgroundColor: isCurrent(b.price) ? "" : `rgba(40, 167, 69, ${bgOpacity})`,
                    }}
                  >
                    <div className="text-left text-green-500">{formatPrice(b.price)}</div>
                    <div className="text-right">{formatQuantity(b.quantity)}</div>
                    <div className="text-right text-muted-foreground">{formatTotal(total)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* 下部バー（固定） */}
        <div className="border-t border-border/70 py-1 px-2 flex items-center justify-between text-[10px] sticky bottom-0 bg-background">
          <div className="flex items-center space-x-2">
            <span className="text-green-500 font-medium">買い 54.51%</span>
            <span className="text-red-500 font-medium">売り 45.49%</span>
          </div>
          <div className="w-24 h-1.5 rounded-full overflow-hidden bg-red-500/70">
            <div className="h-full bg-green-500/70" style={{ width: '54.51%' }}></div>
          </div>
        </div>
      </div>
    </IndicatorPanel>
  );
}

