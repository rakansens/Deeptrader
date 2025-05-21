"use client";

import { useCallback } from "react";
import { DRAWING_MODES, type DrawingMode } from "@/types/chart";
import {
  previewTrendline,
  drawTrendline,
} from "@/hooks/use-trendline-tool";
import { previewFibonacci, drawFibonacci } from "@/hooks/use-fibonacci-tool";
import {
  previewHorizontalLine,
  drawHorizontalLine,
} from "@/hooks/use-horizontal-line-tool";
import { previewBox, drawBox } from "@/hooks/use-box-tool";
import { previewArrow, drawArrow } from "@/hooks/use-arrow-tool";

export interface Point {
  x: number;
  y: number;
}

interface UseToolPreviewOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  color: string;
  strokeWidth: number;
  clearPreview: () => void;
}

/**
 * ツールごとのプレビューおよび確定描画処理を提供するフック
 */
export function useToolPreview({
  canvasRef,
  color,
  strokeWidth,
  clearPreview,
}: UseToolPreviewOptions) {
  const preview = useCallback(
    (mode: DrawingMode, start: Point | null, x: number, y: number) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      switch (mode) {
        case DRAWING_MODES.TRENDLINE:
          clearPreview();
          previewTrendline(ctx, start, x, y, color, strokeWidth);
          break;
        case DRAWING_MODES.FIBONACCI:
          clearPreview();
          previewFibonacci(ctx, start, x, y, color, strokeWidth);
          break;
        case DRAWING_MODES.HORIZONTAL_LINE:
          clearPreview();
          previewHorizontalLine(ctx, canvasRef.current, y, color, strokeWidth);
          break;
        case DRAWING_MODES.BOX:
          clearPreview();
          previewBox(ctx, start, x, y, color, strokeWidth);
          break;
        case DRAWING_MODES.ARROW:
          clearPreview();
          previewArrow(ctx, start, x, y, color, strokeWidth);
          break;
        case DRAWING_MODES.RULER:
          clearPreview();
          drawRulerPreview(ctx, canvasRef.current, start, x, y, color, strokeWidth);
          break;
        default:
          break;
      }
    },
    [canvasRef, color, strokeWidth, clearPreview],
  );

  const draw = useCallback(
    (mode: DrawingMode, start: Point | null, x: number, y: number) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      switch (mode) {
        case DRAWING_MODES.TRENDLINE:
          drawTrendline(ctx, start, x, y, color, strokeWidth);
          break;
        case DRAWING_MODES.FIBONACCI:
          drawFibonacci(ctx, start, x, y, color, strokeWidth);
          break;
        case DRAWING_MODES.HORIZONTAL_LINE:
          drawHorizontalLine(ctx, canvasRef.current, y, color, strokeWidth);
          break;
        case DRAWING_MODES.BOX:
          drawBox(ctx, start, x, y, color, strokeWidth);
          break;
        case DRAWING_MODES.ARROW:
          drawArrow(ctx, start, x, y, color, strokeWidth);
          break;
        case DRAWING_MODES.RULER:
          drawRulerPreview(ctx, canvasRef.current, start, x, y, color, strokeWidth);
          break;
        default:
          break;
      }
    },
    [canvasRef, color, strokeWidth],
  );

  return { preview, draw };
}

function drawRulerPreview(
  ctx: CanvasRenderingContext2D | null,
  canvas: HTMLCanvasElement | null,
  start: Point | null,
  endX: number,
  endY: number,
  color: string,
  strokeWidth: number,
) {
  if (!ctx || !canvas || !start) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  const diff = Math.abs(endY - start.y);
  const percent = ((diff / canvas.height) * 100).toFixed(2);
  const text = `${diff.toFixed(2)}px (${percent}%)`;
  ctx.fillStyle = color;
  ctx.font = "12px Arial";
  ctx.fillText(text, (start.x + endX) / 2 + 5, (start.y + endY) / 2 - 5);
}

export default useToolPreview;
