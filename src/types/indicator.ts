export type SMAResult = {
  name: 'SMA';
  value: number;
};

export type RSIResult = {
  name: 'RSI';
  value: number;
};

export type MACDResult = {
  name: 'MACD';
  macd: number;
  signal: number;
  histogram: number;
};

export type BollingerResult = {
  name: 'Bollinger';
  upper: number;
  lower: number;
};

export type IndicatorResult =
  | SMAResult
  | RSIResult
  | MACDResult
  | BollingerResult;
