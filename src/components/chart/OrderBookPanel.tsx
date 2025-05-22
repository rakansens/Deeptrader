"use client";
import { useState } from "react";
import IndicatorPanel from "./IndicatorPanel";
import useOrderBook from "@/hooks/chart/use-order-book";
import { cn } from "@/lib/utils";
import type { SymbolValue } from "@/constants/chart";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 表示モード
type ViewMode = "both" | "bids" | "asks";

// 精度の型定義
type PricePrecision = 0.01 | 0.1 | 1 | 10;

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
  // 精度の状態を管理
  const [precision, setPrecision] = useState<PricePrecision>(0.01);

  const isCurrent = (price: number) =>
    currentPrice !== undefined && Math.abs(price - currentPrice) < 1e-6;

  // より多くのデータを表示（スクロールで閲覧可能）
  const maxRows = 50; // データ量を増加
  const reversedAsks = [...asks].reverse().slice(0, maxRows);
  const limitedBids = bids.slice(0, maxRows);

  // 数値を適切にフォーマット
  const formatPrice = (price: number) => {
    // 精度に基づいて小数点以下の桁数を調整
    const decimalPlaces = 
      precision === 0.01 ? 2 : 
      precision === 0.1 ? 1 : 
      precision === 1 ? 0 : 
      precision === 10 ? -1 : 2; // デフォルトは2桁
      
    // 10の場合は10単位に丸める
    if (precision === 10) {
      const roundedPrice = Math.round(price / 10) * 10;
      return roundedPrice.toFixed(0);
    }
    
    return price.toFixed(decimalPlaces);
  };

  const formatQuantity = (qty: number) => {
    if (qty < 0.001) {
      return qty.toFixed(6);
    } else if (qty < 0.01) {
      return qty.toFixed(5);
    } else if (qty < 0.1) {
      return qty.toFixed(4);
    } else if (qty < 1) {
      return qty.toFixed(3);
    } else {
      return qty.toFixed(2);
    }
  };

  const formatTotal = (total: number) => {
    if (total >= 10000) {
      return `${(total / 1000).toFixed(1)}K`;
    } else if (total >= 1000) {
      return `${(total / 1000).toFixed(2)}K`;
    } else if (total >= 100) {
      return total.toFixed(1);
    } else {
      return total.toFixed(2);
    }
  };

  // 背景色の透明度を数量に基づいて計算（最大値を基準に）
  const maxAsksQty = Math.max(...reversedAsks.map(a => a.quantity), 0.0001);
  const maxBidsQty = Math.max(...limitedBids.map(b => b.quantity), 0.0001);

  const getOpacity = (quantity: number, isAsk: boolean) => {
    const maxQty = isAsk ? maxAsksQty : maxBidsQty;
    const opacity = Math.min(0.4, Math.max(0.05, quantity / maxQty * 0.5));
    return opacity;
  };

  // 精度に基づいて注文をグループ化
  const groupOrdersByPrecision = (orders: { price: number; quantity: number }[]) => {
    if (precision <= 0.01) return orders; // 最小精度の場合はそのまま返す
    
    const groupedMap = new Map<number, number>();
    
    orders.forEach(order => {
      // 精度に基づいて価格を丸める
      const roundedPrice = Math.round(order.price / precision) * precision;
      const existingQuantity = groupedMap.get(roundedPrice) || 0;
      groupedMap.set(roundedPrice, existingQuantity + order.quantity);
    });
    
    // Mapをオブジェクトの配列に変換
    return Array.from(groupedMap.entries()).map(([price, quantity]) => ({
      price,
      quantity
    })).sort((a, b) => a.price - b.price); // 価格でソート
  };
  
  // 精度に基づいて注文をグループ化
  const groupedAsks = precision > 0.01 ? groupOrdersByPrecision(asks) : asks;
  const groupedBids = precision > 0.01 ? groupOrdersByPrecision(bids) : bids;
  
  // 表示用に処理
  const displayAsks = [...groupedAsks].reverse().slice(0, maxRows);
  const displayBids = groupedBids.slice(0, maxRows);

  return (
    <IndicatorPanel
      title="オーダーブック"
      height={height}
      onClose={onClose}
      className={className}
    >
      <div className="flex items-center justify-between border-b border-border/40 py-1 px-2 text-xs bg-secondary">
        <div className="flex gap-1">
          <button
            className={cn(
              "px-1.5 py-0.5 rounded transition-colors",
              viewMode === "bids" ? "bg-success/20 text-success" : "hover:bg-accent/30"
            )}
            onClick={() => setViewMode("bids")}
            title="買い注文のみ表示"
          >
            <span className="font-medium text-[10px]">買い</span>
          </button>
          <button
            className={cn(
              "px-1.5 py-0.5 rounded transition-colors",
              viewMode === "asks" ? "bg-error/20 text-error" : "hover:bg-accent/30"
            )}
            onClick={() => setViewMode("asks")}
            title="売り注文のみ表示"
          >
            <span className="font-medium text-[10px]">売り</span>
          </button>
          <button
            className={cn(
              "px-1.5 py-0.5 rounded transition-colors",
              viewMode === "both" ? "bg-primary/20 text-primary" : "hover:bg-accent/30"
            )}
            onClick={() => setViewMode("both")}
            title="両方表示"
          >
            <span className="font-medium text-[10px]">両方</span>
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-1 text-muted-foreground text-[10px] cursor-pointer hover:text-foreground">
              <span>精度: {precision}</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-0 w-auto p-1">
            <DropdownMenuItem 
              className={cn(
                "text-[11px] px-2 py-1",
                precision === 0.01 && "bg-accent text-accent-foreground"
              )} 
              onClick={() => setPrecision(0.01)}
            >
              0.01
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={cn(
                "text-[11px] px-2 py-1",
                precision === 0.1 && "bg-accent text-accent-foreground"
              )} 
              onClick={() => setPrecision(0.1)}
            >
              0.1
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={cn(
                "text-[11px] px-2 py-1",
                precision === 1 && "bg-accent text-accent-foreground"
              )} 
              onClick={() => setPrecision(1)}
            >
              1
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={cn(
                "text-[11px] px-2 py-1",
                precision === 10 && "bg-accent text-accent-foreground"
              )} 
              onClick={() => setPrecision(10)}
            >
              10
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col h-full">
        {/* ヘッダー（固定） */}
        <div className="w-full grid grid-cols-3 text-[12px] text-muted-foreground py-1.5 px-2 border-b border-border/40 sticky top-0 bg-card z-10">
          <div className="text-left">価格 (USDT)</div>
          <div className="text-right">数量 (BTC)</div>
          <div className="text-right">合計</div>
        </div>
        
        {/* スクロール可能なコンテンツエリア - スクロール機能を強化 */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 font-mono-trading text-[13px] overscroll-contain">
          {(viewMode === "both" || viewMode === "asks") && (
            <div className="w-full">
              {displayAsks.map((a, i) => {
                const total = a.price * a.quantity;
                const bgOpacity = getOpacity(a.quantity, true);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-3 py-[3px] px-2 border-b border-border/10 relative",
                      isCurrent(a.price) && "bg-accent/30"
                    )}
                  >
                    <div className="absolute top-0 bottom-0 right-0 z-0" 
                      style={{ 
                        width: `${Math.max(5, Math.min(100, (a.quantity / maxAsksQty) * 100))}%`,
                        backgroundColor: `rgba(255, 77, 77, ${bgOpacity})`,
                      }}
                    />
                    <div className="text-left text-error relative z-10 font-medium">{formatPrice(a.price)}</div>
                    <div className="text-right relative z-10">{formatQuantity(a.quantity)}</div>
                    <div className="text-right text-muted-foreground relative z-10">{formatTotal(total)}</div>
                  </div>
                );
              })}
            </div>
          )}
          
          {currentPrice !== undefined && (
            <div
              className="py-1.5 flex items-center justify-between px-2 border-y border-primary/50 bg-primary/10"
            >
              <div className="flex items-center">
                <ChevronUp className="h-3.5 w-3.5 text-success mr-1" />
                <span className="text-primary font-medium text-[13px]">現在価格</span>
              </div>
              <div>
                <span className="font-medium text-[14px]">{currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                <span className="text-[11px] ml-1 text-muted-foreground">USDT</span>
              </div>
            </div>
          )}
          
          {(viewMode === "both" || viewMode === "bids") && (
            <div className="w-full">
              {displayBids.map((b, i) => {
                const total = b.price * b.quantity;
                const bgOpacity = getOpacity(b.quantity, false);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-3 py-[3px] px-2 border-b border-border/10 relative",
                      isCurrent(b.price) && "bg-accent/30"
                    )}
                  >
                    <div className="absolute top-0 bottom-0 right-0 z-0" 
                      style={{ 
                        width: `${Math.max(5, Math.min(100, (b.quantity / maxBidsQty) * 100))}%`,
                        backgroundColor: `rgba(13, 223, 186, ${bgOpacity})`,
                      }}
                    />
                    <div className="text-left text-success relative z-10 font-medium">{formatPrice(b.price)}</div>
                    <div className="text-right relative z-10">{formatQuantity(b.quantity)}</div>
                    <div className="text-right text-muted-foreground relative z-10">{formatTotal(total)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* 下部バー（固定） */}
        <div className="border-t border-border/40 py-1.5 px-2 flex items-center justify-between text-[11px] sticky bottom-0 bg-secondary">
          <div className="flex items-center space-x-2">
            <span className="text-success font-medium">買い 54.51%</span>
            <span className="text-error font-medium">売り 45.49%</span>
          </div>
          <div className="w-24 h-1.5 rounded-full overflow-hidden bg-error/70">
            <div className="h-full bg-success/70" style={{ width: '54.51%' }}></div>
          </div>
        </div>
      </div>
    </IndicatorPanel>
  );
}

