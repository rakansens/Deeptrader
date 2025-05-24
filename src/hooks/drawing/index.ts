// src/hooks/drawing/index.ts  
// 描画フック統一エクスポート - Phase 2B統合 + Phase 5A型統合

// 🎨 共通型（統合）
export type { Point } from '@/types';

// 🎨 描画ツール（統合）
export {
  previewBox,
  drawBox,
  previewArrow,
  drawArrow,
  previewTrendline,
  drawTrendline,
  previewFibonacci,
  drawFibonacci,
  previewFreehand,
  drawFreehand,
  previewHorizontalLine,
  drawHorizontalLine,
} from './tools';

// 🎮 描画フック
export { default as usePointerEvents } from './use-pointer-events';
export { default as useEraser } from './use-eraser';
export { default as useTextInput } from './use-text-input'; 