"use client";

import {
  Pencil,
  TrendingUp,
  BarChart3,
  MousePointer,
  Minus,
  Square,
  ArrowUpRight,
  Ruler,
  Type,
  Trash2,
  Eraser,
} from "lucide-react";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import type { DrawingMode } from "@/types/chart";
import { DRAWING_MODES } from "@/types/chart";
import DrawingColorPicker from "./drawing-color-picker";
import EraserSizeControl from "./eraser-size-control";
import { cn } from "@/lib/utils";

interface ChartSidebarProps {
  mode: DrawingMode | null;
  onModeChange: (mode: DrawingMode | null) => void;
  onClear?: () => void;
  drawingColor: string;
  onColorChange: (color: string) => void;
  registerShortcuts?: () => void;
  unregisterShortcuts?: () => void;
  className?: string;
  // 消しゴムサイズ管理用のプロパティを追加
  eraserSize?: number;
  setEraserSize?: (size: number) => void;
  // 垂直表示モード
  vertical?: boolean;
}

interface ToolInfo {
  mode: DrawingMode | null;
  icon: LucideIcon;
  label: string;
}

const DRAWING_TOOLS: ToolInfo[] = [
  { mode: null, icon: MousePointer, label: "選択ツール" },
  { mode: "freehand", icon: Pencil, label: "フリーハンド描画" },
  { mode: "trendline", icon: TrendingUp, label: "トレンドライン" },
  { mode: "fibonacci", icon: BarChart3, label: "フィボナッチリトレースメント" },
  { mode: "horizontal-line", icon: Minus, label: "水平線" },
  { mode: "box", icon: Square, label: "ボックス描画" },
  { mode: "arrow", icon: ArrowUpRight, label: "矢印マーカー" },
  { mode: "ruler", icon: Ruler, label: "ルーラー" },
  { mode: "text", icon: Type, label: "テキスト" },
  { mode: "eraser", icon: Eraser, label: "消しゴム" },
];

/**
 * チャート横に表示する描画ツールバー
 * TradingViewと同様の仕様
 */
export default function ChartSidebar({
  mode,
  onModeChange,
  onClear,
  drawingColor,
  onColorChange,
  registerShortcuts,
  unregisterShortcuts,
  className,
  eraserSize = 30,
  setEraserSize = () => {},
  vertical = false,
}: ChartSidebarProps) {
  // ツールをクリックした時のハンドラー
  const handleToolClick = (clickedMode: DrawingMode | null) => {
    // 同じツールをクリックしたら描画モードを解除する
    if (mode === clickedMode) {
      onModeChange(null);
    } else {
      onModeChange(clickedMode);
    }
  };

  useEffect(() => {
    // マウント時に一度だけショートカットを登録
    registerShortcuts?.();
    return () => {
      // アンマウント時にクリーンアップ
      unregisterShortcuts?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 依存配列を空にしてマウント/アンマウント時のみ実行

  // アクティブかどうかを判定するヘルパー関数
  const isActive = (toolMode: DrawingMode | null) => mode === toolMode;

  return (
    <div
      data-testid="chart-sidebar"
      className={cn(
        "flex gap-1.5 p-1.5 bg-background/95 backdrop-blur-sm rounded-md border border-border shadow-md",
        vertical ? "flex-col" : "flex-row",
        className
      )}
    >
      {DRAWING_TOOLS.map(({ mode: toolMode, icon: Icon, label }) => (
        <button
          key={label}
          className={`p-2 rounded-md flex items-center justify-center transition-colors ${
            toolMode === "eraser"
              ? isActive(toolMode)
                ? "bg-red-500/90 text-white"
                : "bg-red-100/80 text-red-500 hover:bg-red-200/90"
              : isActive(toolMode)
                ? "bg-primary/90 text-primary-foreground"
                : "bg-muted/80 text-muted-foreground hover:bg-muted"
          }`}
          onClick={() => handleToolClick(toolMode)}
          aria-label={label}
          title={label}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}

      {/* 消しゴムツールが選択されている場合にサイズ調整スライダーを表示 */}
      {mode === "eraser" && (
        <EraserSizeControl
          size={eraserSize}
          onChange={setEraserSize}
          className={cn("w-full", vertical ? "mt-1" : "ml-1")}
        />
      )}

      <DrawingColorPicker
        value={drawingColor}
        onChange={onColorChange}
        className={vertical ? "mt-1" : "ml-1"}
      />

      {onClear && (
        <button
          className={cn(
            "p-2 rounded-md flex items-center justify-center bg-muted/80 text-muted-foreground hover:bg-red-100/80 hover:text-red-600 transition-colors",
            vertical ? "mt-2" : "ml-2"
          )}
          onClick={onClear}
          aria-label="全て消去"
          title="全て消去"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
