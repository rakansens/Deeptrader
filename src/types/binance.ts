// src/types/binance.ts
/**
 * Binance REST APIの`/klines`エンドポイントが返すタプル型
 * 各要素の詳細はBinance公式ドキュメントを参照
 */
export type BinanceKline = [
  number, // open time
  string, // open price
  string, // high price
  string, // low price
  string, // close price
  string, // volume
  number, // close time
  string, // quote asset volume
  number, // number of trades
  string, // taker buy base asset volume
  string, // taker buy quote asset volume
  string, // ignore
];

/**
 * Binance WebSocketの取引データメッセージ
 */
export interface BinanceTradeMessage {
  /** イベントタイプ */
  e: 'trade';
  /** イベントタイム */
  E: number;
  /** シンボル */
  s: string;
  /** 取引ID */
  t: number;
  /** 価格 */
  p: string;
  /** 量 */
  q: string;
  /** 買い注文ID */
  b: number;
  /** 売り注文ID */
  a: number;
  /** 取引タイム */
  T: number;
  /** バイヤーがマーケットメイカーか */
  m: boolean;
  /** 無視されるフラグ */
  M: boolean;
}

/** kline オブジェクト */
export interface BinanceKlineData {
  t: number; // 開始時間
  T: number; // 終了時間
  s: string; // シンボル
  i: string; // インターバル
  f: number; // 最初の取引ID
  L: number; // 最後の取引ID
  o: string; // オープン価格
  c: string; // クローズ価格
  h: string; // 高値
  l: string; // 安値
  v: string; // ベース資産取引量
  n: number; // 取引数
  x: boolean; // このキャンドルはクローズ済みか
  q: string; // 見積資産取引量
  V: string; // テーカーベース資産取引量
  Q: string; // テーカー見積資産取引量
  B?: string; // 無視されるフィールド
}

/**
 * Binance WebSocketのローソク足メッセージ
 */
export interface BinanceKlineMessage {
  /** イベントタイプ */
  e: 'kline';
  /** イベントタイム */
  E: number;
  /** シンボル */
  s: string;
  /** キャンドルデータ */
  k: BinanceKlineData;
  /** PING/PONGやSUBSCRIBE時の応答 */
  result?: unknown;
  /** リクエストID */
  id?: number;
}

