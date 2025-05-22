// src/mastra/agents/backtestAgent.ts
// バックテストエージェントの定義
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { AI_MODEL } from "@/lib/env";

// 環境変数からAIモデルを取得
const aiModel = AI_MODEL;

import { Memory } from "@mastra/memory";
import type { MastraMemory, MastraStorage } from "@mastra/core";
import { SupabaseVector } from "../adapters/SupabaseVector";

// ツールのインポート
import { backtestTool } from "../tools/backtestTool";

// メモリ設定（新 API：オブジェクト 1 つで渡す）
const memory = new Memory({
  // FIXME: narrow `any` once SupabaseVector adapter implements full MastraStorage interface
  storage: SupabaseVector as any,
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
 * トレーディング戦略のバックテストと分析を行います
 */
export const backtestAgent = new Agent({
  name: "バックテストスペシャリスト",
  instructions: `あなたはトレーディング戦略のバックテストを行う専門家です。
  ユーザーの提案した戦略に基づいて、過去のデータで検証し、結果を分析・報告します。
  バックテスト結果では勝率、プロフィットファクター、最大ドローダウンなどの
  重要な指標を含めた総合評価を提供してください。`,
  model: openai(aiModel),
  tools: {
    backtestTool,
  },
  memory,
});