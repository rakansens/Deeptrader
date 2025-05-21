export interface Point {
  x: number;
  y: number;
}

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
