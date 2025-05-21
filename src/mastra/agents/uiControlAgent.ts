// src/mastra/agents/uiControlAgent.ts
// UI制御専用エージェントの定義
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { AI_MODEL } from "@/lib/env";

// AIモデルの設定
const aiModel = AI_MODEL;
import { Memory } from "@mastra/memory";
import type { MastraMemory } from "@mastra/core";

// ツール
import { changeTimeframeTool } from "../tools/changeTimeframeTool";
import { toggleIndicatorTool } from "../tools/toggleIndicatorTool";

// メモリ設定
const memory = new Memory({
  options: {
    lastMessages: 20,
    semanticRecall: {
      topK: 3,
      messageRange: 1,
    },
  },
}) as unknown as MastraMemory;

/**
 * UI操作エージェント
 * チャートやインジケーターなどフロントエンドの操作を担当します
 */
export const uiControlAgent = new Agent({
  name: "UIコントロールエージェント",
  instructions: `あなたはDeepTraderのユーザーインターフェースを操作する専門エージェントです。
  指定されたツールを用いて、チャートの時間足変更やインジケーターの切り替えなどのUI操作を実行してください。
  実行結果は簡潔に報告してください。`,
  model: openai(aiModel),
  tools: {
    changeTimeframeTool,
    toggleIndicatorTool,
  },
  memory,
});
