export interface IndicatorOptions {
  ma: boolean;
  rsi: boolean;
  macd?: boolean;
  boll?: boolean;
}

export type IndicatorsChangeHandler = (value: IndicatorOptions) => void;
