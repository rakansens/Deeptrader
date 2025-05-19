// src/mastra/tools/onChainDataTool.ts
// オンチェーンデータツール
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getAddressInfo } from '@/infrastructure/blockchain-service';

/**
 * オンチェーンデータ取得ツール
 * 指定したアドレスの残高やトランザクション数を取得する
 */
export const onChainDataTool = createTool({
  id: 'on-chain-data-tool',
  description: 'オンチェーンデータを取得します',
  inputSchema: z.object({
    address: z.string().describe('ウォレットアドレス')
  }),
  execute: async ({ context }) => {
    const info = await getAddressInfo(context.address);
    return info;
  }
});
