"use client";
import IndicatorPanel from "./IndicatorPanel";
import useOrderBook from "@/hooks/chart/use-order-book";
import { cn } from "@/lib/utils";
import type { SymbolValue } from "@/constants/chart";

interface OrderBookPanelProps {
  symbol: SymbolValue;
  height: number;
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

  const isCurrent = (price: number) =>
    currentPrice !== undefined && Math.abs(price - currentPrice) < 1e-6;

  // 表示数を増やす（20行まで表示）
  const maxRows = 20;
  const reversedAsks = [...asks].reverse().slice(0, maxRows);
  const limitedBids = bids.slice(0, maxRows);

  return (
    <IndicatorPanel
      title="OrderBook"
      height={height}
      onClose={onClose}
      className={className}
    >
      <div
        className="text-xs h-full overflow-auto flex flex-col"
        data-testid="orderbook-panel"
      >
        <table className="w-full mb-0.5" data-testid="asks-table">
          <thead>
            <tr className="text-xs">
              <th className="text-left py-0">Ask</th>
              <th className="text-right py-0">Qty</th>
            </tr>
          </thead>
          <tbody className="leading-tight">
            {reversedAsks.map((a, i) => (
              <tr
                key={i}
                className={cn(
                  "text-red-700 dark:text-red-400",
                  isCurrent(a.price) && "bg-accent/50 font-bold"
                )}
                data-testid={isCurrent(a.price) ? "current-price-row" : "ask-row"}
              >
                <td className="text-left py-0">{a.price}</td>
                <td className="text-right py-0">{a.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {currentPrice !== undefined && (
          <div
            className="py-[1px] text-center font-bold bg-accent/50 text-xs"
            data-testid="current-price-row"
          >
            {currentPrice}
          </div>
        )}
        <table className="w-full mt-0.5" data-testid="bids-table">
          <thead>
            <tr className="text-xs">
              <th className="text-left py-0">Bid</th>
              <th className="text-right py-0">Qty</th>
            </tr>
          </thead>
          <tbody className="leading-tight">
            {limitedBids.map((b, i) => (
              <tr
                key={i}
                className={cn(
                  "text-green-700 dark:text-green-400",
                  isCurrent(b.price) && "bg-accent/50 font-bold"
                )}
                data-testid={isCurrent(b.price) ? "current-price-row" : "bid-row"}
              >
                <td className="text-left py-0">{b.price}</td>
                <td className="text-right py-0">{b.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IndicatorPanel>
  );
}

