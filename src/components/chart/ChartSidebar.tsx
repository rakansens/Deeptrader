'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Pencil,
  TrendingUp,
  BarChart3,
  MousePointer,
  Minus,
  Square,
  ArrowUpRight,
  Eraser,
} from 'lucide-react';

// null は描画モードが非アクティブな状態を表す
export type DrawingMode =
  | 'freehand'
  | 'trendline'
  | 'fibonacci'
  | 'horizontal-line'
  | 'box'
  | 'arrow'
  | null;

interface ChartSidebarProps {
  mode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  onClear?: () => void;
  className?: string;
}

/**
 * チャート横に表示する描画ツールバー
 * TradingViewと同様の仕様
 */
export default function ChartSidebar({
  mode,
  onModeChange,
  onClear,
  className,
}: ChartSidebarProps) {
  // ツールをクリックした時のハンドラー
  const handleToolClick = (clickedMode: DrawingMode) => {
    // 同じツールをクリックしたら描画モードを解除する
    if (mode === clickedMode) {
      onModeChange(null);
    } else {
      onModeChange(clickedMode);
    }
  };

  // アクティブかどうかを判定するヘルパー関数
  const isActive = (toolMode: DrawingMode) => mode === toolMode;

  return (
    <div
      data-testid="chart-sidebar"
      className={`flex flex-col gap-2 p-2 bg-background/80 backdrop-blur-sm rounded-md border ${className ?? ''}`}
    >
      <button
        className={`w-full p-2 rounded-md flex items-center justify-center ${
          isActive(null) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
        onClick={() => handleToolClick(null)}
        aria-label="選択ツール"
        title="選択ツール"
      >
        <MousePointer className="h-4 w-4" />
      </button>

      <button
        className={`w-full p-2 rounded-md flex items-center justify-center ${
          isActive('freehand') ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
        onClick={() => handleToolClick('freehand')}
        aria-label="フリーハンド描画"
        title="フリーハンド描画"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <button
        className={`w-full p-2 rounded-md flex items-center justify-center ${
          isActive('trendline') ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
        onClick={() => handleToolClick('trendline')}
        aria-label="トレンドライン"
        title="トレンドライン"
      >
        <TrendingUp className="h-4 w-4" />
      </button>

      <button
        className={`w-full p-2 rounded-md flex items-center justify-center ${
          isActive('fibonacci') ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
        onClick={() => handleToolClick('fibonacci')}
        aria-label="フィボナッチリトレースメント"
        title="フィボナッチリトレースメント"
      >
        <BarChart3 className="h-4 w-4" />
      </button>

      <button
        className={`w-full p-2 rounded-md flex items-center justify-center ${
          isActive('horizontal-line')
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
        onClick={() => handleToolClick('horizontal-line')}
        aria-label="水平線"
        title="水平線"
      >
        <Minus className="h-4 w-4" />
      </button>

      <button
        className={`w-full p-2 rounded-md flex items-center justify-center ${
          isActive('box')
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
        onClick={() => handleToolClick('box')}
        aria-label="ボックス描画"
        title="ボックス描画"
      >
        <Square className="h-4 w-4" />
      </button>

      <button
        className={`w-full p-2 rounded-md flex items-center justify-center ${
          isActive('arrow')
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
        onClick={() => handleToolClick('arrow')}
        aria-label="矢印マーカー"
        title="矢印マーカー"
      >
        <ArrowUpRight className="h-4 w-4" />
      </button>

      {onClear && (
        <button
          className="w-full p-2 mt-4 rounded-md flex items-center justify-center bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-600"
          onClick={onClear}
          aria-label="全て消去"
          title="全て消去"
        >
          <Eraser className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
