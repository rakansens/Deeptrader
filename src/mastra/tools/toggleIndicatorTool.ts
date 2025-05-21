import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * チャートインジケーターの表示を切り替えるツール
 * フロントエンドの toggleIndicator 関数を呼び出す
 */
export const toggleIndicatorTool = createTool({
  id: 'toggle-indicator-tool',
  description: 'インジケーターの表示を切り替えます',
  inputSchema: z.object({
    indicator: z.enum(['ma', 'rsi', 'macd', 'boll']).describe('対象インジケーター'),
    enabled: z.boolean().optional().describe('有効にするかどうか'),
  }),
  execute: async ({ context }) => {
    const fn = window.toggleIndicator;
    if (fn) {
      fn(context.indicator, context.enabled);
      return { success: true };
    }
    throw new Error('toggleIndicator 関数が定義されていません');
  },
});
