"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";

/**
 * チャート上に手描きできるキャンバスコンポーネント
 */
export interface DrawingCanvasHandle {
  clear: () => void;
}

export type DrawingMode = 'freehand' | 'trendline' | 'fibonacci' | null;

export interface DrawingCanvasProps {
  /** 描画を有効にするか */
  enabled?: boolean;
  /** 線の色 */
  color?: string;
  /** 線の太さ */
  strokeWidth?: number;
  /** 描画モード */
  mode?: DrawingMode;
  className?: string;
}

function DrawingCanvas(
  {
    enabled = true,
    color = "#ef4444",
    strokeWidth = 2,
    mode = 'freehand',
    className,
  }: DrawingCanvasProps,
  ref: React.Ref<DrawingCanvasHandle>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  // モードがnullの場合、'freehand'として扱う
  const actualMode = mode === null ? 'freehand' : mode;

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        console.log(`Canvas resized: ${canvas.width}x${canvas.height}, Enabled: ${enabled}`);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      console.log('描画モードが有効になりました');
    } else {
      console.log('描画モードが無効になりました');
    }
  }, [enabled]);

  const getContext = () => canvasRef.current?.getContext("2d");

  // プレビュー描画をクリアする関数
  const clearPreview = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx || !startPoint.current) return;
    
    // 全体をクリアせず、プレビュー部分だけを復元するともっと効率的だが
    // 単純化のため、現在はキャンバス全体をクリアしています
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // トレンドラインをプレビュー描画する関数
  const drawTrendlinePreview = (endX: number, endY: number) => {
    const ctx = getContext();
    if (!ctx || !startPoint.current) return;
    
    clearPreview();
    
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(startPoint.current.x, startPoint.current.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  };

  // フィボナッチリトレースメントをプレビュー描画する関数
  const drawFibonacciPreview = (endX: number, endY: number) => {
    const ctx = getContext();
    if (!ctx || !startPoint.current) return;
    
    clearPreview();
    
    const left = Math.min(startPoint.current.x, endX);
    const right = Math.max(startPoint.current.x, endX);
    const top = Math.min(startPoint.current.y, endY);
    const bottom = Math.max(startPoint.current.y, endY);
    const diff = bottom - top;
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    
    // 垂直ラインの描画を削除
    
    // フィボナッチレベルを描画（水平線のみ）
    levels.forEach((lv) => {
      const y = bottom - diff * lv;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      
      // レベル値をラベル表示
      ctx.fillStyle = color;
      ctx.font = '10px Arial';
      ctx.fillText(`${lv * 100}%`, right + 5, y);
    });
  };

  // カーソルスタイルを決定
  const getCursorStyle = () => {
    if (!enabled) return '';
    
    // モードに基づいてカーソルスタイルを返す
    switch (mode) {
      case null:
        return 'cursor-default'; // 選択モード
      case 'freehand':
        return 'cursor-pointer'; // フリーハンド (Tailwindにcursor-pencilがないため)
      default:
        return 'cursor-crosshair'; // トレンドラインとフィボナッチ
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    // 選択モード（null）の場合は描画せずに返る
    if (mode === null) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (actualMode === 'freehand') {
      drawing.current = true;
      lastPoint.current = point;
    } else {
      startPoint.current = point;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    // 選択モード（null）の場合は描画せずに返る
    if (mode === null) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (actualMode === 'freehand' && drawing.current) {
      // フリーハンド描画処理（従来通り）
      const ctx = getContext();
      const canvas = canvasRef.current;
      if (!ctx || !canvas || !lastPoint.current) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPoint.current = { x, y };
    } else if (startPoint.current) {
      // トレンドラインとフィボナッチのリアルタイムプレビュー
      if (actualMode === 'trendline') {
        drawTrendlinePreview(x, y);
      } else if (actualMode === 'fibonacci') {
        drawFibonacciPreview(x, y);
      }
    }
  };

  const endDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    // 選択モード（null）の場合は描画せずに返る
    if (mode === null) return;
    
    if (actualMode === 'freehand') {
      drawing.current = false;
      lastPoint.current = null;
    } else if (startPoint.current) {
      const ctx = getContext();
      const canvas = canvasRef.current;
      if (!ctx || !canvas) {
        startPoint.current = null;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const end = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      
      // プレビューと同じ描画をここで行う（最終確定）
      // プレビューをクリアせずそのまま残すことも可能
      if (actualMode === 'trendline') {
        drawTrendlinePreview(end.x, end.y);
      } else if (actualMode === 'fibonacci') {
        drawFibonacciPreview(end.x, end.y);
      }
      
      startPoint.current = null;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`${className} ${getCursorStyle()}`}
      style={{
        zIndex: 10, 
        touchAction: 'none',
        pointerEvents: mode === null ? 'none' : 'auto', // 選択モード時はイベントを透過
        border: mode !== null && enabled ? '1px dashed rgba(239, 68, 68, 0.3)' : 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrawing}
      onPointerLeave={endDrawing}
      data-testid="drawing-canvas"
    />
  );
}

export default forwardRef(DrawingCanvas);
