// src/mastra/tools/onChainDataTool.ts
// オンチェーンデータツール
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * オンチェーンデータ取得ツールのダミー実装
 */
export const onChainDataTool = createTool({
  id: 'on-chain-data-tool',
  description: 'オンチェーンデータを取得します',
  inputSchema: z.object({
    address: z.string().describe('ウォレットアドレス')
  }),
  execute: async ({ context }) => {
    return {
      address: context.address,
      message: 'オンチェーンデータ取得は未実装です'
    };
  }
});
