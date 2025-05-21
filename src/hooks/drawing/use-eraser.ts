import { useState, useEffect } from 'react';
import { DRAWING_MODES, type DrawingMode } from '@/types/chart';

export interface UseEraserOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  mode: DrawingMode | null;
  eraserSize: number;
}

export function useEraser({ canvasRef, mode, eraserSize }: UseEraserOptions) {
  const [eraserPosition, setEraserPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (mode === DRAWING_MODES.ERASER) {
      const canvas = canvasRef.current;
      if (canvas) {
        setEraserPosition({ x: canvas.width / 2, y: canvas.height / 2 });
      }
    } else {
      setEraserPosition(null);
    }
  }, [mode, canvasRef]);

  const erase = (
    ctx: CanvasRenderingContext2D | null,
    savedCanvasState: React.MutableRefObject<ImageData | null>,
    x: number,
    y: number,
  ) => {
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const radius = eraserSize / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect(x - radius, y - radius, eraserSize, eraserSize);
    ctx.restore();
    savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const getCursorStyle = () => {
    if (mode === DRAWING_MODES.ERASER) {
      return { cursor: 'none' };
    }
    return {};
  };

  return { eraserPosition, setEraserPosition, erase, getCursorStyle };
}

export default useEraser;
