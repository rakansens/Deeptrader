"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface ChartToolbarProps {
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
  indicators: {
    ma: boolean;
    rsi: boolean;
    macd?: boolean;
    boll?: boolean;
  };
  onIndicatorsChange: (value: {
    ma: boolean;
    rsi: boolean;
    macd?: boolean;
    boll?: boolean;
  }) => void;
}

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];
const SYMBOLS = [
  { value: "BTCUSDT", label: "BTC/USDT" },
  { value: "ETHUSDT", label: "ETH/USDT" },
  { value: "BNBUSDT", label: "BNB/USDT" },
];

export default function ChartToolbar({
  timeframe,
  onTimeframeChange,
  symbol = "BTCUSDT",
  onSymbolChange,
  indicators,
  onIndicatorsChange,
}: ChartToolbarProps) {
  return (
    <div className="flex flex-col gap-2 p-2 bg-background border-b border-border md:flex-row md:items-center md:justify-between">
      <div className="flex gap-3 items-center">
        {onSymbolChange && (
          <select
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm bg-background"
          >
            {SYMBOLS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        )}
        <ToggleGroup
          type="single"
          value={timeframe}
          onValueChange={(v) => v && onTimeframeChange(v)}
        >
          {TIMEFRAMES.map((tf) => (
            <ToggleGroupItem key={tf} value={tf} aria-label={`Timeframe ${tf}`}>
              {tf}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="ma-toggle"
            checked={indicators.ma}
            onCheckedChange={(v) =>
              onIndicatorsChange({ ...indicators, ma: v })
            }
          />
          <Label htmlFor="ma-toggle">MA</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="rsi-toggle"
            checked={indicators.rsi}
            onCheckedChange={(v) =>
              onIndicatorsChange({ ...indicators, rsi: v })
            }
          />
          <Label htmlFor="rsi-toggle">RSI</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="macd-toggle"
            checked={!!indicators.macd}
            onCheckedChange={(v) =>
              onIndicatorsChange({ ...indicators, macd: v })
            }
          />
          <Label htmlFor="macd-toggle">MACD</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="boll-toggle"
            checked={!!indicators.boll}
            onCheckedChange={(v) =>
              onIndicatorsChange({ ...indicators, boll: v })
            }
          />
          <Label htmlFor="boll-toggle">BOLL</Label>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
