"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";

/**
 * チャート上に手描きできるキャンバスコンポーネント
 */
export interface DrawingCanvasHandle {
  clear: () => void;
}

export interface DrawingCanvasProps {
  /** 描画を有効にするか */
  enabled?: boolean;
  /** 線の色 */
  color?: string;
  /** 線の太さ */
  strokeWidth?: number;
  className?: string;
}

function DrawingCanvas(
  {
    enabled = true,
    color = "#ef4444",
    strokeWidth = 2,
    className,
  }: DrawingCanvasProps,
  ref: React.Ref<DrawingCanvasHandle>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

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
    console.log('描画開始');
    drawing.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    lastPoint.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
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

  const endDrawing = () => {
    if (drawing.current && enabled) {
      console.log('描画終了');
    }
    drawing.current = false;
    lastPoint.current = null;
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
