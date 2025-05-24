// src/mastra/tools/tradingExecutionTool.ts
// 取引実行ツール
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { placeOrder } from '@/infrastructure/exchange/bitget-service';
import { orderSideSchema, orderTypeSchema } from '@/types/trading';

/**
 * 取引実行ツール
 * Bitgetへ注文を送信する
 */
export const tradingExecutionTool = createTool({
  id: 'trading-execution-tool',
  description: 'Bitgetで注文を実行します',
  inputSchema: z.object({
    symbol: z.string(),
    side: orderSideSchema,
    type: orderTypeSchema,
    quantity: z.number(),
    price: z.number().optional()
  }),
  execute: async ({ context }) => {
    await placeOrder({
      symbol: context.symbol,
      side: context.side,
      type: context.type,
      quantity: context.quantity,
      price: context.price
    });
    return { success: true };
  }
});
