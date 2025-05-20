// src/mastra/tools/evaluationTool.ts
// 検索結果評価ツール
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * 検索クエリと結果から品質スコアを算出する簡易ツール
 */
export const evaluationTool = createTool({
  id: 'evaluation-tool',
  description: '検索結果の品質を評価します',
  inputSchema: z.object({
    query: z.string().describe('ユーザーが入力した検索クエリ'),
    result: z.string().describe('取得した結果テキスト')
  }),
  execute: async ({ context }) => {
    const { query, result } = context;
    const quality = result.length / (query.length + result.length);
    return { quality };
  }
});
