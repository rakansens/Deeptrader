// src/mastra/agents/orchestratorAgent.ts
// オーケストラエージェントの定義
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { AI_MODEL } from "@/lib/env";

// 使用するAIモデル
const aiModel = AI_MODEL;
import { Memory } from "@mastra/memory";
import type { MastraMemory } from "@mastra/core";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { SupabaseVector } from "../adapters/SupabaseVector";

// 既存エージェントのインポート
import { tradingAgent } from "./tradingAgent";
import { researchAgent } from "./researchAgent";
import { uiControlAgent } from "./uiControlAgent";
import { backtestAgent } from "./backtestAgent";

/**
 * 重複する委任ツール定義をまとめるユーティリティ
 */
function makeDelegateTool(
  id: string,
  description: string,
  agent: Agent
) {
  return createTool({
    id,
    description,
    inputSchema: z.object({
      message: z.string().describe("ユーザーからの問い合わせ"),
    }),
    execute: async ({ context }) => agent.stream(context.message),
  });
}

// メモリ設定
const memory = new Memory({
  // FIXME: SupabaseVector が正式に MastraStorage を実装したら any を外す
  storage: SupabaseVector as any,
  options: {
    lastMessages: 40,
    semanticRecall: {
      topK: 5,
      messageRange: 2,
    },
  },
}) as unknown as MastraMemory;

export const delegateTradingTool = makeDelegateTool(
  "delegate-trading-tool",
  "トレーディングエージェントへ指示を渡します",
  tradingAgent
);

export const delegateResearchTool = makeDelegateTool(
  "delegate-research-tool",
  "リサーチエージェントへ指示を渡します",
  researchAgent
);

export const delegateUiControlTool = makeDelegateTool(
  "delegate-ui-control-tool",
  "UIコントロールエージェントへ指示を渡します",
  uiControlAgent
);

export const delegateBacktestTool = makeDelegateTool(
  "delegate-backtest-tool",
  "バックテストエージェントへ指示を渡します",
  backtestAgent
);

/**
 * オーケストラエージェント
 * ユーザーの入力を解析し、適切な専門エージェントへ委任して結果を統合します
 */
export const orchestratorAgent = new Agent({
  name: "オーケストラエージェント",
  instructions: `あなたは複数の専門AIを統合するオーケストレーターです。
  ユーザーの入力を解析し、適切な専門エージェントへ委任して結果を統合する。
  トレーディング関連はトレーディングエージェント、情報収集はリサーチエージェントを活用すること。
  各情報がどのエージェントから提供されたかを回答に明記し、
  エージェント間で内容が矛盾する場合はその不一致を簡潔に指摘してください。
  最終的な回答をまとめて提示してください。`,
  model: openai(aiModel),
  tools: {
    delegateTradingTool,
    delegateResearchTool,
    delegateUiControlTool,
    delegateBacktestTool,
  },
  memory,
});
