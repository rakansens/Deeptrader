"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { logger } from "@/lib/logger";

/**
 * チャート上に手描きできるキャンバスコンポーネント
 */
export interface DrawingCanvasHandle {
  clear: () => void;
}

export type DrawingMode =
  | 'freehand'
  | 'trendline'
  | 'fibonacci'
  | 'horizontal-line'
  | 'box'
  | 'arrow'
  | null;

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
  // 描画内容を保存するための変数
  const savedCanvasState = useRef<ImageData | null>(null);

  // モードがnullの場合、'freehand'として扱う
  const actualMode = mode === null ? 'freehand' : mode;

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        savedCanvasState.current = null;
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
        logger.debug(`Canvas resized: ${canvas.width}x${canvas.height}, Enabled: ${enabled}`);
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
      logger.debug('描画モードが有効になりました');
    } else {
      logger.debug('描画モードが無効になりました');
    }
  }, [enabled]);

  const getContext = () => canvasRef.current?.getContext("2d");

  // プレビュー描画をクリアする関数（保存した状態に復元）
  const clearPreview = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx || !startPoint.current) return;
    
    if (savedCanvasState.current) {
      // 保存した状態を復元
      ctx.putImageData(savedCanvasState.current, 0, 0);
    } else {
      // 初回時のフォールバック
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    // 選択モード（null）の場合は描画せずに返る
    if (mode === null) return;
    
    logger.debug('描画開始');
    const rect = e.currentTarget.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    
    // キャンバスの現在状態を保存
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (canvas && ctx) {
      savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    
    if (actualMode === 'freehand') {
      drawing.current = true;
      lastPoint.current = point;
    } else {
      startPoint.current = point;
    }
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

  // 水平線のプレビューを描画する関数
  const drawHorizontalLinePreview = (y: number) => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    clearPreview();

    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  };

  // ボックス描画のプレビュー
  const drawBoxPreview = (endX: number, endY: number) => {
    const ctx = getContext();
    if (!ctx || !startPoint.current) return;

    clearPreview();

    const left = Math.min(startPoint.current.x, endX);
    const top = Math.min(startPoint.current.y, endY);
    const width = Math.abs(endX - startPoint.current.x);
    const height = Math.abs(endY - startPoint.current.y);

    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.stroke();
  };

  // 矢印マーカーのプレビュー
  const drawArrowPreview = (endX: number, endY: number) => {
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

    // 矢印の先端を描画
    const angle = Math.atan2(endY - startPoint.current.y, endX - startPoint.current.x);
    const len = 10;
    const theta = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - len * Math.cos(angle - theta), endY - len * Math.sin(angle - theta));
    ctx.lineTo(endX - len * Math.cos(angle + theta), endY - len * Math.sin(angle + theta));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
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
        return 'cursor-crosshair'; // その他の描画ツール
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
      // 各モードのリアルタイムプレビュー
      if (actualMode === 'trendline') {
        drawTrendlinePreview(x, y);
      } else if (actualMode === 'fibonacci') {
        drawFibonacciPreview(x, y);
      } else if (actualMode === 'horizontal-line') {
        drawHorizontalLinePreview(y);
      } else if (actualMode === 'box') {
        drawBoxPreview(x, y);
      } else if (actualMode === 'arrow') {
        drawArrowPreview(x, y);
      }
    }
  };

  const endDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    // 選択モード（null）の場合は描画せずに返る
    if (mode === null) return;
    
    logger.debug('描画終了');
    
    if (actualMode === 'freehand') {
      drawing.current = false;
      lastPoint.current = null;
      // フリーハンド描画終了時に現在の状態を保存
      const canvas = canvasRef.current;
      const ctx = getContext();
      if (canvas && ctx) {
        savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
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
      } else if (actualMode === 'horizontal-line') {
        drawHorizontalLinePreview(end.y);
      } else if (actualMode === 'box') {
        drawBoxPreview(end.x, end.y);
      } else if (actualMode === 'arrow') {
        drawArrowPreview(end.x, end.y);
      }
      
      startPoint.current = null;
      // 描画終了時に現在の状態を保存
      if (canvas && ctx) {
        savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
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
