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
