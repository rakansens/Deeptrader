// src/types/trading.ts
// 取引・注文・オーダーブック関連型統合 - Phase 5B統合
// order.ts + orderbook.ts + chart-analysis.ts統合版

import { z } from 'zod';

// =============================================================================
// 📊 オーダーブック関連
// =============================================================================

/** オーダーブックのエントリ（価格・数量ペア） */
export interface OrderBookEntry {
  price: number;
  quantity: number;
}

/** オーダーブック（買い注文・売り注文） */
export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

// =============================================================================
// 📝 注文関連
// =============================================================================

/** 注文サイド（買い・売り）スキーマ */
export const orderSideSchema = z.enum(['buy', 'sell']);
export type OrderSide = z.infer<typeof orderSideSchema>;

/** 注文タイプ（指値・成行）スキーマ */
export const orderTypeSchema = z.enum(['limit', 'market']);
export type OrderType = z.infer<typeof orderTypeSchema>;

// =============================================================================
// 📈 チャート分析関連
// =============================================================================

/** チャート分析結果の基本型 */
export interface ChartAnalysisResult {
  symbol: string;
  timeframe: string;
  analysisTimestamp: string;
  period: number;
  indicators: IndicatorResult[];
  patterns: string[];
}

// 注: IndicatorResult型は@/types/indicatorで定義済み 