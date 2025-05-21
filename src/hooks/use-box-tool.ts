export interface Point {
  x: number;
  y: number;
}

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
