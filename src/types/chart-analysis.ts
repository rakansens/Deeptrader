import type { Timeframe } from '@/constants/chart';
import type { IndicatorResult } from './indicator';

export interface ChartAnalysisResult {
  symbol: string;
  timeframe: Timeframe;
  analysisTimestamp: string;
  period: number;
  indicators: IndicatorResult[];
  patterns: string[];
}
