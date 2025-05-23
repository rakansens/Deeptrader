import { useRef } from 'react';
import { DRAWING_MODES, type DrawingMode } from '@/types/chart';
import {
  drawFreehand,
  previewTrendline,
  drawTrendline,
  previewFibonacci,
  drawFibonacci,
  previewHorizontalLine,
  drawHorizontalLine,
  previewBox,
  drawBox,
  previewArrow,
  drawArrow,
} from './tools';

export interface UsePointerEventsOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  enabled: boolean;
  mode: DrawingMode | null;
  color: string;
  strokeWidth: number;
  eraserSize: number;
  startTextInput: (x: number, y: number) => void;
  commitText: (
    ctx: CanvasRenderingContext2D | null,
    canvas: HTMLCanvasElement | null,
  ) => ImageData | void;
  erase: (
    ctx: CanvasRenderingContext2D | null,
    saved: React.MutableRefObject<ImageData | null>,
    x: number,
    y: number,
  ) => void;
  setEraserPosition: (pos: { x: number; y: number } | null) => void;
}

export function usePointerEvents({
  canvasRef,
  enabled,
  mode,
  color,
  strokeWidth,
  eraserSize,
  startTextInput,
  commitText,
  erase,
  setEraserPosition,
}: UsePointerEventsOptions) {
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const savedCanvasState = useRef<ImageData | null>(null);

  const actualMode = mode === null ? DRAWING_MODES.FREEHAND : mode;

  const getContext = (): CanvasRenderingContext2D | null => canvasRef.current?.getContext('2d') || null;

  const clearPreview = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx || !startPoint.current) return;
    if (savedCanvasState.current) {
      ctx.putImageData(savedCanvasState.current, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled || mode === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (canvas && ctx) {
      savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    if (actualMode === DRAWING_MODES.TEXT) {
      startTextInput(point.x, point.y);
      return;
    }
    if (actualMode === DRAWING_MODES.FREEHAND || actualMode === DRAWING_MODES.ERASER) {
      drawing.current = true;
      lastPoint.current = point;
      if (actualMode === DRAWING_MODES.ERASER) {
        erase(getContext(), savedCanvasState, point.x, point.y);
      }
    } else {
      startPoint.current = point;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled || mode === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === DRAWING_MODES.ERASER) {
      setEraserPosition({ x, y });
    }

    const ctx = getContext();
    if (actualMode === DRAWING_MODES.FREEHAND && drawing.current) {
      if (!ctx || !lastPoint.current) return;
      drawFreehand(ctx, lastPoint.current, x, y, color, strokeWidth);
      lastPoint.current = { x, y };
    } else if (actualMode === DRAWING_MODES.ERASER && drawing.current) {
      erase(ctx, savedCanvasState, x, y);
      lastPoint.current = { x, y };
    } else if (startPoint.current) {
      if (!ctx) return;
      if (actualMode === DRAWING_MODES.TRENDLINE) {
        clearPreview();
        previewTrendline(ctx, startPoint.current, x, y, color, strokeWidth);
      } else if (actualMode === DRAWING_MODES.FIBONACCI) {
        clearPreview();
        previewFibonacci(ctx, startPoint.current, x, y, color, strokeWidth);
      } else if (actualMode === DRAWING_MODES.HORIZONTAL_LINE) {
        clearPreview();
        previewHorizontalLine(ctx, canvasRef.current, y, color, strokeWidth);
      } else if (actualMode === DRAWING_MODES.BOX) {
        clearPreview();
        previewBox(ctx, startPoint.current, x, y, color, strokeWidth);
      } else if (actualMode === DRAWING_MODES.ARROW) {
        clearPreview();
        previewArrow(ctx, startPoint.current, x, y, color, strokeWidth);
      } else if (actualMode === DRAWING_MODES.RULER) {
        clearPreview();
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(startPoint.current.x, startPoint.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        const diff = Math.abs(y - startPoint.current.y);
        const percent = ((diff / (canvasRef.current?.height ?? 1)) * 100).toFixed(2);
        const text = `${diff.toFixed(2)}px (${percent}%)`;
        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        ctx.fillText(text, (startPoint.current.x + x) / 2 + 5, (startPoint.current.y + y) / 2 - 5);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled || mode === null) return;
    if (actualMode === DRAWING_MODES.TEXT) return;
    if (actualMode === DRAWING_MODES.FREEHAND || actualMode === DRAWING_MODES.ERASER) {
      drawing.current = false;
      lastPoint.current = null;
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
      const end = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      clearPreview();
      if (actualMode === DRAWING_MODES.TRENDLINE) {
        drawTrendline(ctx, startPoint.current, end.x, end.y, color, strokeWidth);
      } else if (actualMode === DRAWING_MODES.FIBONACCI) {
        drawFibonacci(ctx, startPoint.current, end.x, end.y, color, strokeWidth);
      } else if (actualMode === DRAWING_MODES.HORIZONTAL_LINE) {
        drawHorizontalLine(ctx, canvasRef.current, end.y, color, strokeWidth);
      } else if (actualMode === DRAWING_MODES.BOX) {
        drawBox(ctx, startPoint.current, end.x, end.y, color, strokeWidth);
      } else if (actualMode === DRAWING_MODES.ARROW) {
        drawArrow(ctx, startPoint.current, end.x, end.y, color, strokeWidth);
      } else if (actualMode === DRAWING_MODES.RULER) {
        clearPreview();
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(startPoint.current.x, startPoint.current.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
      savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      startPoint.current = null;
    }
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode === DRAWING_MODES.ERASER) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setEraserPosition({ x, y });
    }
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerUp(e);
    if (mode === DRAWING_MODES.ERASER) {
      setEraserPosition(null);
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === DRAWING_MODES.ERASER) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setEraserPosition({ x, y });
      }
    }
  };

  return {
    drawing,
    savedCanvasState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerEnter,
    handlePointerLeave,
    handleContainerMouseMove,
  };
}

export default usePointerEvents;
