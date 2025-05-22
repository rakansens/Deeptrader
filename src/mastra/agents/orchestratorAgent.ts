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

// 既存エージェントのインポート
import { tradingAgent } from "./tradingAgent";
import { researchAgent } from "./researchAgent";
import { uiControlAgent } from "./uiControlAgent";
import { backtestAgent } from "./backtestAgent";

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

// トレーディングエージェントへの委任ツール
export const delegateTradingTool = createTool({
  id: "delegate-trading-tool",
  description: "トレーディングエージェントへ指示を渡します",
  inputSchema: z.object({
    message: z.string().describe("ユーザーからの問い合わせ"),
  }),
  execute: async ({ context }) => tradingAgent.stream(context.message),
});

// リサーチエージェントへの委任ツール
export const delegateResearchTool = createTool({
  id: "delegate-research-tool",
  description: "リサーチエージェントへ指示を渡します",
  inputSchema: z.object({
    message: z.string().describe("ユーザーからの問い合わせ"),
  }),
  execute: async ({ context }) => researchAgent.stream(context.message),
});

// UIコントロールエージェントへの委任ツール
export const delegateUiControlTool = createTool({
  id: "delegate-ui-control-tool",
  description: "UIコントロールエージェントへ指示を渡します",
  inputSchema: z.object({
    message: z.string().describe("ユーザーからの問い合わせ"),
  }),
  execute: async ({ context }) => uiControlAgent.stream(context.message),
});

// バックテストエージェントへの委任ツール
export const delegateBacktestTool = createTool({
  id: "delegate-backtest-tool",
  description: "バックテストエージェントへ指示を渡します",
  inputSchema: z.object({
    message: z.string().describe("ユーザーからの問い合わせ"),
  }),
  execute: async ({ context }) => backtestAgent.stream(context.message),
});

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
