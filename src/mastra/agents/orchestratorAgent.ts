// src/mastra/agents/orchestratorAgent.ts
// オーケストラエージェントの定義（最小限版）
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { AI_MODEL } from "@/lib/env.server";

// 使用するAIモデル
const aiModel = AI_MODEL;

/**
 * オーケストラエージェント（最小限版）
 * ツールやメモリを使わない最もシンプルな設定
 */
export const orchestratorAgent = new Agent({
  name: "オーケストラエージェント",
  instructions: `あなたはDeeptraderの基本AIアシスタントです。
  ユーザーの質問に対して、トレーディングや投資に関する一般的な情報を提供してください。
  現在はシステムの基本機能で動作しており、今後より高度な機能が追加される予定です。`,
  model: openai(aiModel),
  // ツールなし、メモリなしの最小構成
});
