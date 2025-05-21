export interface Point {
  x: number;
  y: number;
}

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
