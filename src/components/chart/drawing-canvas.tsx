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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
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
    if (!drawing.current || !enabled) return;
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !lastPoint.current) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPoint.current = { x, y };
  };

  const endDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
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
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      if (actualMode === 'trendline') {
        ctx.beginPath();
        ctx.moveTo(startPoint.current.x, startPoint.current.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (actualMode === 'fibonacci') {
        const left = Math.min(startPoint.current.x, end.x);
        const right = Math.max(startPoint.current.x, end.x);
        const top = Math.min(startPoint.current.y, end.y);
        const bottom = Math.max(startPoint.current.y, end.y);
        const diff = bottom - top;
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        levels.forEach((lv) => {
          const y = bottom - diff * lv;
          ctx.beginPath();
          ctx.moveTo(left, y);
          ctx.lineTo(right, y);
          ctx.stroke();
        });
      }
      startPoint.current = null;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`${className} ${enabled ? 'cursor-crosshair' : ''}`}
      style={{
        zIndex: 10, 
        touchAction: 'none',
        pointerEvents: enabled ? 'auto' : 'none',
        border: enabled ? '1px dashed rgba(239, 68, 68, 0.3)' : 'none',
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
