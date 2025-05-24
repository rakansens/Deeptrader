// src/lib/market-data-utils.ts
// 市場データ変換統一ユーティリティ - Phase 6A-5統合
// 価格・数量・Klineデータの変換処理を一元化

/**
 * Order Book エントリの型定義
 */
export interface OrderBookEntry {
  price: number;
  quantity: number;
}

/**
 * Binance API Kline形式の型定義
 * [timestamp, open, high, low, close, volume, ...]
 */
export type BinanceKline = [
  number,    // 0: timestamp
  string,    // 1: open
  string,    // 2: high
  string,    // 3: low
  string,    // 4: close
  string,    // 5: volume
  ...any[]   // その他のフィールド
];

/**
 * 価格・数量ペア文字列をOrderBookEntryに変換
 * Binance Order Book APIの [price, quantity] 形式を統一変換
 * 
 * @param priceQuantityPair - [price, quantity] 形式の文字列配列
 * @returns OrderBookEntry オブジェクト
 * 
 * 統合対象: binance-service.ts, use-order-book.ts (4箇所)
 */
export function parseOrderBookEntry([price, quantity]: [string, string]): OrderBookEntry {
  return {
    price: parseFloat(price),
    quantity: parseFloat(quantity)
  };
}

/**
 * 価格・数量ペア配列をOrderBookEntryの配列に変換
 * 
 * @param entries - [price, quantity][] 形式の配列
 * @returns OrderBookEntry[] 配列
 */
export function parseOrderBookEntries(entries: [string, string][]): OrderBookEntry[] {
  return entries.map(parseOrderBookEntry);
}

/**
 * Binance Klineデータから終値を抽出
 * インデックス4が終値（close price）
 * 
 * @param kline - Binance Kline配列形式
 * @returns 終値（number）
 * 
 * 統合対象: backtestTool.ts, entrySuggestionTool.ts (2箇所)
 */
export function parseKlineClose(kline: BinanceKline): number {
  return parseFloat(kline[4]);
}

/**
 * Binance Kline配列から終値のみを抽出
 * 
 * @param klines - Binance Kline配列
 * @returns 終値配列（number[]）
 */
export function parseKlineCloses(klines: BinanceKline[]): number[] {
  return klines.map(parseKlineClose);
}

/**
 * Binance Klineデータの全OHLCV値を抽出
 * 
 * @param kline - Binance Kline配列形式
 * @returns OHLCV オブジェクト
 */
export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function parseKlineOHLCV(kline: BinanceKline): OHLCV {
  return {
    timestamp: kline[0],
    open: parseFloat(kline[1]),
    high: parseFloat(kline[2]),
    low: parseFloat(kline[3]),
    close: parseFloat(kline[4]),
    volume: parseFloat(kline[5])
  };
}

/**
 * 安全な数値変換（nullish値対応）
 * open-interest-service.ts での使用を想定
 * 
 * @param value - 変換対象の値
 * @param defaultValue - デフォルト値（デフォルト: 0）
 * @returns 数値
 * 
 * 統合対象: open-interest-service.ts (1箇所)
 */
export function safeParseNumber(value: string | number | null | undefined, defaultValue = 0): number {
  if (value == null) return defaultValue;
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 価格文字列を安全に数値変換
 * 暗号通貨価格は高精度が必要なためparseFloatを使用
 */
export function parsePrice(price: string | number): number {
  return typeof price === 'number' ? price : parseFloat(price);
}

/**
 * 数量文字列を安全に数値変換
 */
export function parseQuantity(quantity: string | number): number {
  return typeof quantity === 'number' ? quantity : parseFloat(quantity);
}

/**
 * 価格フォーマット用ヘルパー（表示用）
 * 8桁精度でフォーマット
 */
export function formatPrice(price: number, decimals = 8): string {
  return price.toFixed(decimals);
}

/**
 * 数量フォーマット用ヘルパー（表示用）
 * 4桁精度でフォーマット
 */
export function formatQuantity(quantity: number, decimals = 4): string {
  return quantity.toFixed(decimals);
} 