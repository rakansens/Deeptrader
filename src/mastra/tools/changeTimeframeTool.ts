import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { TIMEFRAMES } from '@/constants/chart';

/**
 * チャートの時間足を変更するツール
 * フロントエンドの changeTimeframe 関数を呼び出す
 */
export const changeTimeframeTool = createTool({
  id: 'change-timeframe-tool',
  description: 'チャートの時間足を変更します',
  inputSchema: z.object({
    timeframe: z.enum(TIMEFRAMES).describe('例: 1m, 5m, 1h'),
  }),
  execute: async ({ context }) => {
    const fn = (window as any).changeTimeframe as ((tf: string) => void) | undefined;
    if (typeof fn === 'function') {
      fn(context.timeframe);
      return { success: true };
    }
    throw new Error('changeTimeframe 関数が定義されていません');
  },
});
