// src/mastra/agents/uiControlAgent.ts
// UIコントロールエージェントの定義
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { AI_MODEL } from "@/lib/env";

// 環境変数からAIモデルを取得
const aiModel = AI_MODEL;
// import { Memory } from "@mastra/memory";
// import type { MastraMemory } from "@mastra/core";
// import { SupabaseVector } from "../adapters/SupabaseVector";

// ツールのインポート
import { toggleIndicatorTool } from "../tools/toggleIndicatorTool";
import { changeTimeframeTool } from "../tools/changeTimeframeTool";

// メモリ設定（Mastra v0.7 仕様） - 一時的に無効化
// const memory = new Memory({
//   // FIXME: tighten `any` once SupabaseVector fully implements MastraStorage
//   storage: SupabaseVector as any,
//   options: {
//     lastMessages: 40,
//     semanticRecall: {
//       topK: 5,
//       messageRange: 2,
//     },
//   },
// }) as unknown as MastraMemory;

/**
 * UIコントロールエージェント
 * チャートのインジケーターや時間枠を操作する機能を提供します
 */
export const uiControlAgent = new Agent({
  name: "UIコントロールエージェント",
  instructions: `あなたはトレーディングプラットフォームのUIを制御するアシスタントです。
  ユーザーのリクエストに基づいて、チャートの設定変更やインジケーターの表示/非表示を行います。
  
  使用可能なツール:
  - インジケーター制御ツール: テクニカル指標の表示・設定変更
  - タイムフレーム変更ツール: チャートの時間枠を変更
  
  UIの操作を簡潔かつ明確に行い、変更後の状態をユーザーに伝えてください。`,
  model: openai(aiModel),
  tools: {
    toggleIndicatorTool,
    changeTimeframeTool,
  },
  // memory,
});
