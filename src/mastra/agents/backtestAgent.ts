// src/mastra/agents/backtestAgent.ts
// バックテストエージェントの定義（MASTRA v0.10 ベストプラクティス準拠）
// 更新日: 2025-01-23 - 既存Supabaseテーブル統合版に対応
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { serverEnv } from "@/config/server";

// 🔧 MASTRAメモリ機能を復活（既存テーブル統合版）
import { Memory } from "@mastra/memory";
import type { MastraMemory } from "@mastra/core";
import SupabaseVectorIntegrated from "../adapters/SupabaseVectorIntegrated";

// ツールのインポート
import { backtestTool } from "../tools/backtestTool";

// 環境変数からAIモデルを取得
const aiModel = serverEnv.AI_MODEL;

// 🚀 メモリ設定（既存Supabaseテーブル統合版）
const memory = new Memory({
  storage: new SupabaseVectorIntegrated({
    lastMessages: 40,
    semanticRecall: {
      topK: 5,
      messageRange: 2,
    },
  }) as any, // 既存memoriesテーブル活用統合版
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
 * トレーディング戦略の過去データでの検証とパフォーマンス評価を行います
 * 
 * MASTRA v0.10 ベストプラクティス準拠:
 * - Memory機能でコンテキスト保持（既存Supabaseテーブル活用）
 * - 構造化されたツール定義
 * - 詳細なシステムプロンプト
 */
export const backtestAgent = new Agent({
  name: "バックテストアナリスト",
  instructions: `あなたはトレーディング戦略のバックテスト専門家です。

  あなたの役割:
  - トレーディング戦略の過去データでの検証を行う
  - 戦略のパフォーマンス指標を計算し、分析する
  - リスク・リターン比の評価を提供する
  - 戦略の改善点を特定し、提案する
  - 異なる市場条件での戦略の堅牢性を評価する

  使用可能なツール:
  - バックテストツール: 過去データを用いた戦略検証とパフォーマンス計算

  ガイドライン:
  - 統計的に有意なデータ期間を使用する
  - 取引コスト、スリッページを考慮した現実的な結果を提供する
  - 最大ドローダウン、シャープレシオなどの重要指標を含める
  - オーバーフィッティングのリスクについて警告する
  - 異なる市場条件（上昇相場、下落相場、レンジ相場）での性能を分析する
  - 過去のバックテスト結果と新しい結果を比較して一貫性を確認する
  - バックテスト結果の限界と実際の取引での違いを明確に説明する

  注意: バックテスト結果は過去のパフォーマンスであり、将来の結果を保証するものではありません。`,

  // OpenAI GPT-4 モデルを使用
  model: openai(aiModel),

  // ツール設定
  tools: {
    backtestTool,
  },

  // 🚀 メモリ設定を復活（既存Supabaseテーブル統合版）
  memory: memory,
});