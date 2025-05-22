"use client";
import { useState } from "react";
import IndicatorPanel from "./IndicatorPanel";
import useOrderBook from "@/hooks/chart/use-order-book";
import { cn } from "@/lib/utils";
import type { SymbolValue } from "@/constants/chart";
import { ChevronDown, ChevronUp } from "lucide-react";
// ドロップダウンメニューは未使用のため削除
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

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

  // 表示行数を固定
  const maxRows = 15; // 15行に変更

  // 数値を適切にフォーマット
  const formatPrice = (price: number) => {
    // 精度に基づいて小数点以下の桁数を調整
    const decimalPlaces = 
      precision === 0.01 ? 2 : 
      precision === 0.1 ? 1 : 
      precision === 1 ? 0 : 
      precision === 10 ? 0 : 2; // デフォルトは2桁
      
    // 10の場合は10単位に丸める
    if (precision === 10) {
      const roundedPrice = Math.round(price / 10) * 10;
      return roundedPrice.toLocaleString();
    }
    
    // 1の場合は整数に丸めて表示
    if (precision === 1) {
      return Math.round(price).toLocaleString();
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

  // 精度に基づいて注文をグループ化する関数
  const processOrders = (
    rawOrders: { price: number; quantity: number }[], 
    isAsk: boolean, 
    maxCount: number
  ) => {
    // より多くのデータを処理する
    const processLimit = maxCount * 50; // さらに多くの注文を取得
    // より大きな範囲のデータを使用
    const ordersToProcess = isAsk
      ? [...rawOrders].sort((a, b) => b.price - a.price).slice(0, processLimit) // asks: 降順（高い価格から）
      : [...rawOrders].sort((a, b) => a.price - b.price).slice(0, processLimit); // bids: 昇順（低い価格から）

    if (ordersToProcess.length === 0 && currentPrice) {
      // データがない場合は現在価格を中心に生成
      const result: {price: number; quantity: number}[] = [];
      const basePrice = Math.round(currentPrice);
      
      if (isAsk) {
        // ASKSは現在価格より上
        for (let i = 0; i < maxCount; i++) {
          result.push({
            price: basePrice + i,
            quantity: 0
          });
        }
        return result.sort((a, b) => b.price - a.price); // 降順
      } else {
        // BIDSは現在価格より下
        for (let i = 0; i < maxCount; i++) {
          result.push({
            price: basePrice - i,
            quantity: 0
          });
        }
        return result.sort((a, b) => a.price - b.price); // 昇順
      }
    } else if (ordersToProcess.length === 0) {
      // データもなく現在価格もない場合
      return Array(maxCount).fill({price: 0, quantity: 0});
    }

    // 精度が0.01の場合はグループ化せずにそのまま返す
    if (precision <= 0.01) {
      return ordersToProcess.slice(0, maxCount);
    }

    const groupedMap = new Map<number, number>();
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    // すべての注文を走査して価格範囲を特定
    ordersToProcess.forEach(order => {
      if (order.quantity > 0) { // 数量が0より大きい注文のみ処理
        minPrice = Math.min(minPrice, order.price);
        maxPrice = Math.max(maxPrice, order.price);
        
        // 精度に基づいて価格を丸める
        let roundedPrice;
        if (precision === 10) {
          roundedPrice = Math.round(order.price / 10) * 10;
        } else {
          roundedPrice = Math.round(order.price / precision) * precision;
        }
        
        // 丸め誤差を防ぐために小数点以下の桁数を制限
        roundedPrice = Number(roundedPrice.toFixed(precision < 1 ? -Math.log10(precision) : 0));
        
        const existingQuantity = groupedMap.get(roundedPrice) || 0;
        groupedMap.set(roundedPrice, existingQuantity + order.quantity);
      }
    });

    // 現在価格を中心に価格レベルを生成（データがない場合は代替手段）
    if (groupedMap.size === 0 && currentPrice) {
      // 価格とその数量を含むオブジェクトの配列を作成
      const result: {price: number; quantity: number}[] = [];
      const basePrice = precision === 10 
        ? Math.round(currentPrice / 10) * 10
        : precision === 1
          ? Math.round(currentPrice)
          : currentPrice;
      
      if (isAsk) {
        // ASKSは現在価格より上
        for (let i = 0; i < maxCount; i++) {
          result.push({
            price: basePrice + (i * precision),
            quantity: 0
          });
        }
        return result.sort((a, b) => b.price - a.price); // 降順
      } else {
        // BIDSは現在価格より下
        for (let i = 0; i < maxCount; i++) {
          result.push({
            price: basePrice - (i * precision),
            quantity: 0
          });
        }
        return result.sort((a, b) => a.price - b.price); // 昇順
      }
    }
    
    // 実際のデータから価格レベルを生成
    let priceLevels: number[] = [];
    
    if (groupedMap.size > 0) {
      // 価格レベルの範囲を設定
      if (precision === 10) {
        // 10の場合は範囲を拡大
        const rangeExtension = Math.max(100, maxCount * 20);
        minPrice = Math.floor((minPrice - rangeExtension) / 10) * 10;
        maxPrice = Math.ceil((maxPrice + rangeExtension) / 10) * 10;
      } else if (precision === 1) {
        // 1の場合も範囲を拡大
        const rangeExtension = Math.max(50, maxCount * 5);
        minPrice = Math.floor(minPrice - rangeExtension);
        maxPrice = Math.ceil(maxPrice + rangeExtension);
      } else {
        // 0.1と0.01の場合
        minPrice = Math.floor(minPrice / precision) * precision;
        maxPrice = Math.ceil(maxPrice / precision) * precision;
        
        // 必要に応じて範囲を少し拡張
        const extraLevels = Math.max(0, maxCount - Math.ceil((maxPrice - minPrice) / precision));
        if (extraLevels > 0) {
          minPrice -= (extraLevels / 2) * precision;
          maxPrice += (extraLevels / 2) * precision;
        }
      }
      
      // 小数点以下の桁数を制限して丸め誤差を防ぐ
      const decimalPlaces = precision < 1 ? -Math.log10(precision) : 0;
      minPrice = Number(minPrice.toFixed(decimalPlaces));
      maxPrice = Number(maxPrice.toFixed(decimalPlaces));
      
      // 昇順または降順に価格レベルを生成
      if (isAsk) {
        // ASKSは降順（高→低）
        for (let price = maxPrice; price >= minPrice; price -= precision) {
          // 丸め誤差を防ぐために小数点以下の桁数を制限
          const roundedPrice = Number(price.toFixed(decimalPlaces));
          priceLevels.push(roundedPrice);
        }
      } else {
        // BIDSは昇順（低→高）
        for (let price = minPrice; price <= maxPrice; price += precision) {
          // 丸め誤差を防ぐために小数点以下の桁数を制限
          const roundedPrice = Number(price.toFixed(decimalPlaces));
          priceLevels.push(roundedPrice);
        }
      }
    } else if (currentPrice) {
      // 実データがなく、現在価格がある場合、代替手段として現在価格を使用
      const basePrice = precision === 10 
        ? Math.round(currentPrice / 10) * 10
        : precision === 1
          ? Math.round(currentPrice)
          : currentPrice;
      
      // 範囲を設定
      const range = precision === 10 ? 200 : precision === 1 ? 20 : 2;
      
      if (isAsk) {
        // ASKSは現在価格より上
        for (let i = 0; i < maxCount; i++) {
          priceLevels.push(basePrice + (i * precision));
        }
        priceLevels.sort((a, b) => b - a); // 降順
      } else {
        // BIDSは現在価格より下
        for (let i = 0; i < maxCount; i++) {
          priceLevels.push(basePrice - (i * precision));
        }
        priceLevels.sort((a, b) => a - b); // 昇順
      }
    }

    // 結果配列の作成
    const result = priceLevels.map(price => ({
      price,
      quantity: groupedMap.get(price) || 0
    }));

    // 数量が0でない項目を優先
    const nonZeroItems = result.filter(item => item.quantity > 0);
    
    // 実際のデータがあれば優先して表示
    if (nonZeroItems.length > 0) {
      // 数量が0でない項目と0の項目を適切に混ぜて表示
      // 十分な数の非ゼロ項目がある場合はそれらのみを表示
      if (nonZeroItems.length >= maxCount) {
        return nonZeroItems.slice(0, maxCount);
      } else {
        // 不足している場合は0の項目を追加する前に適切に並べ替え
        const zeroItems = result.filter(item => item.quantity === 0);
        
        // 現在価格に近い順に並べ替え（0の項目のみ）
        if (currentPrice) {
          zeroItems.sort((a, b) => 
            Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice)
          );
        }
        
        // 必要な数の0アイテムを追加
        const combinedItems = [...nonZeroItems, ...zeroItems].slice(0, maxCount);
        
        // 最終的な並べ替え
        return isAsk
          ? combinedItems.sort((a, b) => b.price - a.price) // ASKSは降順
          : combinedItems.sort((a, b) => a.price - b.price); // BIDSは昇順
      }
    }
    
    // データが取得できない場合は、少なくとも現在価格の周辺を表示
    if (currentPrice) {
      result.sort((a, b) => 
        Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice)
      );
      
      // 最終的な並べ替え
      const finalResult = result.slice(0, maxCount);
      return isAsk
        ? finalResult.sort((a, b) => b.price - a.price) // ASKSは降順
        : finalResult.sort((a, b) => a.price - b.price); // BIDSは昇順
    }
    
    // どの条件も満たさない場合は結果をそのまま返す（通常は発生しない）
    return result.slice(0, maxCount);
  };

  // 注文データの処理
  const displayAsks = processOrders(asks, true, maxRows);
  const displayBids = processOrders(bids, false, maxRows);

  // 背景色の透明度を数量に基づいて計算
  const maxAsksQty = Math.max(...displayAsks.map(a => a.quantity), 0.0001);
  const maxBidsQty = Math.max(...displayBids.map(b => b.quantity), 0.0001);

  const getOpacity = (quantity: number, isAsk: boolean) => {
    const maxQty = isAsk ? maxAsksQty : maxBidsQty;
    const opacity = Math.min(0.4, Math.max(0.05, quantity / maxQty * 0.5));
    return opacity;
  };

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
              "px-1.5 py-0.5 rounded",
              viewMode === "bids" ? "bg-success/20 text-success" : "bg-secondary"
            )}
            onClick={() => setViewMode("bids")}

          >
            <span className="font-medium text-[10px]">買い</span>
          </button>
          <button
            className={cn(
              "px-1.5 py-0.5 rounded",
              viewMode === "asks" ? "bg-error/20 text-error" : "bg-secondary"
            )}
            onClick={() => setViewMode("asks")}

          >
            <span className="font-medium text-[10px]">売り</span>
          </button>
          <button
            className={cn(
              "px-1.5 py-0.5 rounded",
              viewMode === "both" ? "bg-primary/20 text-primary" : "bg-secondary"
            )}
            onClick={() => setViewMode("both")}

          >
            <span className="font-medium text-[10px]">両方</span>
          </button>
        </div>
        
        {/* 精度選択ボタン - 視認性を向上 */}
        <div className="flex items-center gap-1.5">
          <button
            className={cn(
              "rounded text-[11px] px-2 py-0.5 font-medium min-w-[32px] transition-colors border",
              precision === 0.01 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-secondary/70 text-muted-foreground border-transparent hover:bg-secondary"
            )}
            onClick={() => setPrecision(0.01)}
          >
            0.01
          </button>
          <button
            className={cn(
              "rounded text-[11px] px-2 py-0.5 font-medium min-w-[32px] transition-colors border",
              precision === 0.1 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-secondary/70 text-muted-foreground border-transparent hover:bg-secondary"
            )}
            onClick={() => setPrecision(0.1)}
          >
            0.1
          </button>
          <button
            className={cn(
              "rounded text-[11px] px-2 py-0.5 font-medium min-w-[32px] transition-colors border",
              precision === 1 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-secondary/70 text-muted-foreground border-transparent hover:bg-secondary"
            )}
            onClick={() => setPrecision(1)}
          >
            1
          </button>
          <button
            className={cn(
              "rounded text-[11px] px-2 py-0.5 font-medium min-w-[32px] transition-colors border",
              precision === 10 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-secondary/70 text-muted-foreground border-transparent hover:bg-secondary"
            )}
            onClick={() => setPrecision(10)}
          >
            10
          </button>
        </div>
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

