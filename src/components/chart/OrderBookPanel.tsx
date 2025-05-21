"use client";
import IndicatorPanel from "./IndicatorPanel";
import useOrderBook from "@/hooks/use-order-book";
import { cn } from "@/lib/utils";
import type { SymbolValue } from "@/constants/chart";

interface OrderBookPanelProps {
  symbol: SymbolValue;
  height: number;
  currentPrice?: number;
  onClose?: () => void;
  className?: string;
}

export default function OrderBookPanel({ symbol, height, currentPrice, onClose, className }: OrderBookPanelProps) {
  const { bids, asks } = useOrderBook(symbol);

  const isCurrent = (price: number) =>
    currentPrice !== undefined && Math.abs(price - currentPrice) < 1e-6;

  return (
    <IndicatorPanel title="OrderBook" height={height} onClose={onClose} className={className}>
      <div className="flex text-xs h-full overflow-auto">
        <table className="flex-1 mr-2" data-testid="bids-table">
          <thead>
            <tr>
              <th className="text-left">Bid</th>
              <th className="text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((b, i) => (
              <tr
                key={i}
                className={cn(
                  "text-green-700 dark:text-green-400",
                  isCurrent(b.price) && "bg-accent/50 font-bold"
                )}
                data-testid={isCurrent(b.price) ? "current-price-row" : "bid-row"}
              >
                <td className="text-left">{b.price}</td>
                <td className="text-right">{b.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="flex-1" data-testid="asks-table">
          <thead>
            <tr>
              <th className="text-left">Ask</th>
              <th className="text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {asks.map((a, i) => (
              <tr
                key={i}
                className={cn(
                  "text-red-700 dark:text-red-400",
                  isCurrent(a.price) && "bg-accent/50 font-bold"
                )}
                data-testid={isCurrent(a.price) ? "current-price-row" : "ask-row"}
              >
                <td className="text-left">{a.price}</td>
                <td className="text-right">{a.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IndicatorPanel>
  );
}

