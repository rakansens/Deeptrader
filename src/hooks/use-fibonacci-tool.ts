export interface Point {
  x: number;
  y: number;
}

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
