// src/mastra/agents/backtestAgent.ts
// バックテストエージェントの定義（MASTRA v0.10 ベストプラクティス準拠）
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { AI_MODEL } from "@/lib/env";

// 🔧 MASTRAメモリ機能を復活
import { Memory } from "@mastra/memory";
import type { MastraMemory } from "@mastra/core";
import { SupabaseVector } from "../adapters/SupabaseVector";

// ツールのインポート
import { backtestTool } from "../tools/backtestTool";

// 環境変数からAIモデルを取得
const aiModel = AI_MODEL;

// 🚀 メモリ設定（MASTRA v0.10 ベストプラクティス）
const memory = new Memory({
  storage: SupabaseVector as any, // SupabaseVectorアダプター使用（シングルトン）
  options: {
    lastMessages: 40, // 直近40メッセージを保持
    semanticRecall: {
      topK: 5, // 類似メッセージ上位5件を取得
      messageRange: 2, // 前後2メッセージを含める
    },
  },
}) as unknown as MastraMemory;

/**
 * バックテストエージェント
 * トレーディング戦略のバックテストと分析を行います
 * 
 * MASTRA v0.10 ベストプラクティス準拠:
 * - Memory機能でコンテキスト保持
 * - 構造化されたツール定義
 * - 詳細なシステムプロンプト
 */
export const backtestAgent = new Agent({
  name: "バックテストスペシャリスト",
  instructions: `あなたはトレーディング戦略のバックテストを行う専門家です。
  ユーザーの提案した戦略に基づいて、過去のデータで検証し、結果を分析・報告します。
  バックテスト結果では勝率、プロフィットファクター、最大ドローダウンなどの
  重要な指標を含めた総合評価を提供してください。
  
  過去のバックテスト結果を参考にして、戦略の改善提案も行ってください。`,
  
  model: openai(aiModel),
  
  tools: {
    backtestTool,
  },
  
  // 🚀 メモリ設定を復活（MASTRAベストプラクティス）
  memory: memory,
});