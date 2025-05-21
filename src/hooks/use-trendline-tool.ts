export interface Point {
  x: number;
  y: number;
}

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
