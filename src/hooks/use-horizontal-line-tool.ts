export interface Point {
  x: number;
  y: number;
}

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
