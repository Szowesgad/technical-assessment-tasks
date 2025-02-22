import { Mask, Point } from '@/types';

export const drawMask = (ctx: CanvasRenderingContext2D, mask: Mask): void => {
  ctx.beginPath();
  ctx.moveTo(mask.points[0].x, mask.points[0].y);
  mask.points.forEach(point => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fillStyle = mask.color;
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1.0;
};

export const clearCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  ctx.clearRect(0, 0, width, height);
};