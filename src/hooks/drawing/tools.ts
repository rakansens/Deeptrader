// src/hooks/drawing/tools.ts
// 描画ツール統合ファイル - Phase 2B統合 + Phase 5A型統合
// 旧: use-box-tool, use-arrow-tool, use-trendline-tool, use-fibonacci-tool, use-freehand-tool, use-horizontal-line-tool

import type { Point } from '@/types';

// =============================================================================
// 📐 共通型定義（@/types/commonに移動）
// =============================================================================
// export interface Point { x: number; y: number; } // 削除: @/types/commonに統合

// =============================================================================
// 📦 ボックス描画ツール (旧: use-box-tool.ts)
// =============================================================================

export function previewBox(
  ctx: CanvasRenderingContext2D | null,
  start: Point | null,
  endX: number,
  endY: number,
  color: string,
  strokeWidth: number,
) {
  if (!ctx || !start) return;
  const left = Math.min(start.x, endX);
  const top = Math.min(start.y, endY);
  const width = Math.abs(endX - start.x);
  const height = Math.abs(endY - start.y);

  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  ctx.rect(left, top, width, height);
  ctx.stroke();
}

export const drawBox = previewBox;

// =============================================================================
// 🏹 矢印描画ツール (旧: use-arrow-tool.ts)
// =============================================================================

export function previewArrow(
  ctx: CanvasRenderingContext2D | null,
  start: Point | null,
  endX: number,
  endY: number,
  color: string,
  strokeWidth: number,
) {
  if (!ctx || !start) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  const angle = Math.atan2(endY - start.y, endX - start.x);
  const len = 10;
  const theta = Math.PI / 6;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - len * Math.cos(angle - theta), endY - len * Math.sin(angle - theta));
  ctx.lineTo(endX - len * Math.cos(angle + theta), endY - len * Math.sin(angle + theta));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export const drawArrow = previewArrow;

// =============================================================================
// 📈 トレンドライン描画ツール (旧: use-trendline-tool.ts)
// =============================================================================

export function previewTrendline(
  ctx: CanvasRenderingContext2D | null,
  start: Point | null,
  endX: number,
  endY: number,
  color: string,
  strokeWidth: number,
) {
  if (!ctx || !start) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

export const drawTrendline = previewTrendline;

// =============================================================================
// 🌀 フィボナッチレベル描画ツール (旧: use-fibonacci-tool.ts)
// =============================================================================

export function previewFibonacci(
  ctx: CanvasRenderingContext2D | null,
  start: Point | null,
  endX: number,
  endY: number,
  color: string,
  strokeWidth: number,
) {
  if (!ctx || !start) return;
  const left = Math.min(start.x, endX);
  const right = Math.max(start.x, endX);
  const top = Math.min(start.y, endY);
  const bottom = Math.max(start.y, endY);
  const diff = bottom - top;
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";

  levels.forEach((lv) => {
    const y = bottom - diff * lv;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = "10px Arial";
    ctx.fillText(`${lv * 100}%`, right + 5, y);
  });
}

export const drawFibonacci = previewFibonacci;

// =============================================================================
// ✏️ 自由描画ツール (旧: use-freehand-tool.ts)
// =============================================================================

export function previewFreehand(
  ctx: CanvasRenderingContext2D | null,
  last: Point | null,
  x: number,
  y: number,
  color: string,
  strokeWidth: number,
) {
  drawFreehand(ctx, last, x, y, color, strokeWidth);
}

export function drawFreehand(
  ctx: CanvasRenderingContext2D | null,
  last: Point | null,
  x: number,
  y: number,
  color: string,
  strokeWidth: number,
) {
  if (!ctx || !last) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(x, y);
  ctx.stroke();
}

// =============================================================================
// ➖ 水平線描画ツール (旧: use-horizontal-line-tool.ts)  
// =============================================================================

export function previewHorizontalLine(
  ctx: CanvasRenderingContext2D | null,
  canvas: HTMLCanvasElement | null,
  y: number,
  color: string,
  strokeWidth: number,
) {
  if (!ctx || !canvas) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvas.width, y);
  ctx.stroke();
}

export const drawHorizontalLine = previewHorizontalLine; 