// src/mastra/agents/backtestAgent.ts
// バックテストエージェントの定義
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';
import type { MastraMemory } from '@mastra/core';

import { backtestTool } from '../tools/backtestTool';

// メモリ設定
const memory = new Memory({
  options: {
    lastMessages: 40,
    semanticRecall: {
      topK: 5,
      messageRange: 2,
    },
  },
}) as unknown as MastraMemory;

/**
 * バックテストエージェント
 * 簡易バックテストツールを用いて戦略検証を行います
 */
export const backtestAgent = new Agent({
  name: 'バックテストエージェント',
  instructions: `あなたは暗号資産トレーディング戦略の検証を支援する専門家です。
  ユーザーから与えられた条件で過去データを用いて簡易バックテストを実行し、結果を要約してください。`,
  model: openai('gpt-4o'),
  tools: { backtestTool },
  memory,
});
