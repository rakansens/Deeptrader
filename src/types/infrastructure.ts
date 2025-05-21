// src/types/infrastructure.ts
import type { Json } from "./supabase";
import type { OrderSide, OrderType } from "./order";

/** ティッカー情報 */
export interface Ticker {
  symbol: string;
  high24h: string;
  low24h: string;
  last: string;
  bidPrice: string;
  askPrice: string;
  volume24h: string;
  timestamp: string;
}

/** 注文リクエスト */
export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  clientOrderId?: string;
  extraParams?: Json;
}

/** アドレス情報 */
export interface AddressInfo {
  address: string;
  balance: string;
  txCount: number;
  nonce: number;
}

/** ニュース記事要約 */
export interface NewsArticle {
  headline: string;
  summary: string;
  url: string;
}

/** センチメント指標 */
export interface SentimentMetrics {
  /** 数値化されたセンチメントスコア (0-100) */
  score: number;
  /** APIが提供する追加情報 */
  valueText?: string;
  /** データ取得時刻 */
  timestamp: string;
}

/** オープンインタレストデータ */
export interface OpenInterestData {
  symbol: string;
  price: number;
  sumOpenInterestValue: number;
  timestamp: string;
}
