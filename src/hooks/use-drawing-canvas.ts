"use client";

import { useRef, useEffect, useImperativeHandle } from 'react';
import { logger } from '@/lib/logger';
import type { DrawingCanvasHandle, DrawingMode } from '@/types/chart';
import { DRAWING_MODES } from '@/types/chart';
import useTextInput from '@/hooks/drawing/use-text-input';
import useEraser from '@/hooks/drawing/use-eraser';
import usePointerEvents from '@/hooks/drawing/use-pointer-events';

export interface UseDrawingCanvasProps {
  enabled?: boolean;
  color?: string;
  strokeWidth?: number;
  mode?: DrawingMode | null;
  eraserSize?: number;
}

export function useDrawingCanvas(
  {
    enabled = true,
    color = '#ef4444',
    strokeWidth = 2,
    mode = DRAWING_MODES.FREEHAND,
    eraserSize = 30,
  }: UseDrawingCanvasProps,
  ref: React.Ref<DrawingCanvasHandle>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const savedCanvasState = useRef<ImageData | null>(null);

  const {
    textInput,
    textInputRef,
    start: startTextInput,
    change: handleTextChange,
    commit,
  } = useTextInput({ color });

  const {
    eraserPosition,
    setEraserPosition,
    erase,
    getCursorStyle: getEraserCursorStyle,
  } = useEraser({ canvasRef, mode, eraserSize });

  const {
    drawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerEnter,
    handlePointerLeave,
    handleContainerMouseMove,
  } = usePointerEvents({
    canvasRef,
    enabled,
    mode,
    color,
    strokeWidth,
    eraserSize,
    startTextInput,
    commitText: (ctx, canvas) => {
      const data = commit(ctx, canvas);
      if (data) savedCanvasState.current = data;
    },
    erase: (ctx, saved, x, y) => erase(ctx, saved, x, y),
    setEraserPosition,
  });

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
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
        if (savedCanvasState.current) {
          const ctx = canvas.getContext('2d');
          ctx?.putImageData(savedCanvasState.current, 0, 0);
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      logger.debug('描画モードが有効になりました');
    } else {
      logger.debug('描画モードが無効になりました');
    }
  }, [enabled]);

  const getCursorStyle = () => {
    if (!enabled) return '';
    switch (mode) {
      case null:
        return 'cursor-default';
      case DRAWING_MODES.FREEHAND:
        return 'cursor-pointer';
      case DRAWING_MODES.ERASER:
        return 'cursor-not-allowed';
      case DRAWING_MODES.TEXT:
        return 'cursor-text';
      default:
        return 'cursor-crosshair';
    }
  };

  return {
    canvasRef,
    containerRef,
    eraserPosition,
    textInput,
    textInputRef,
    isDrawing: drawing.current,
    getCursorStyle,
    getEraserCursorStyle,
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
    },
    handleContainerMouseMove,
    handleTextChange,
    handleTextSubmit: () => {
      const ctx = canvasRef.current?.getContext('2d');
      const canvas = canvasRef.current;
      const data = commit(ctx ?? null, canvas ?? null);
      if (data) savedCanvasState.current = data;
    },
  };
}

export default useDrawingCanvas;
