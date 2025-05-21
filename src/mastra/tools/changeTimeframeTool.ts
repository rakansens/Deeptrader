import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { TIMEFRAMES, type Timeframe } from '@/constants/chart';
import { getUiControl } from '@/contexts/UiControlContext';

/**
 * チャートの時間足を変更するツール
 * フロントエンドの changeTimeframe 関数を呼び出す
 */
export const changeTimeframeTool = createTool({
  id: 'change-timeframe-tool',
  description: 'チャートの時間足を変更します',
  inputSchema: z.object({
    timeframe: z.enum(['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M']).describe('例: 1m, 5m, 1h'),
  }),
  execute: async ({ context }) => {
    const { changeTimeframe } = getUiControl();
    if (changeTimeframe) {
      changeTimeframe(context.timeframe as Timeframe);
      return { success: true };
    }
    throw new Error('changeTimeframe 関数が定義されていません');
  },
});
