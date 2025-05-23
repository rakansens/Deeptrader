// src/mastra/agents/researchAgent.ts
// 市場リサーチエージェントの定義（MASTRA v0.10 ベストプラクティス準拠）
// 更新日: 2025-01-23 - 既存Supabaseテーブル統合版に対応
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { serverEnv } from "@/config/server";

// 🔧 MASTRAメモリ機能を復活（既存テーブル統合版）
import { Memory } from "@mastra/memory";
import type { MastraMemory } from "@mastra/core";
import SupabaseVectorIntegrated from "../adapters/SupabaseVectorIntegrated";

// ツールのインポート
import { newsAnalysisTool } from "../tools/newsAnalysisTool";
import { onChainDataTool } from "../tools/onChainDataTool";
import { marketSentimentTool } from "../tools/marketSentimentTool";
import { evaluationTool } from "../tools/evaluationTool";
import { openInterestTool } from "../tools/openInterestTool";

// 環境変数から AI モデルを取得
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
 * 市場リサーチエージェント
 * 市場の基本的なリサーチ、ニュース分析、センチメント分析を提供します
 * 
 * MASTRA v0.10 ベストプラクティス準拠:
 * - Memory機能でコンテキスト保持（既存Supabaseテーブル活用）
 * - 構造化されたツール定義
 * - 詳細なシステムプロンプト
 */
export const researchAgent = new Agent({
  name: "市場リサーチャー",
  instructions: `あなたは暗号資産市場の専門的なリサーチアナリストです。

  あなたの役割:
  - 市場の基本的なリサーチと情報収集を行う
  - ニュースの影響を分析し、市場に与える潜在的なインパクトを評価する
  - 市場センチメントの動向を監視し、レポートを作成する
  - オンチェーンデータを分析し、実際の資金フローを評価する
  - 長期的な市場トレンドの予測と評価を提供する

  使用可能なツール:
  - ニュース分析ツール: 最新ニュースの収集と影響評価
  - オンチェーンデータツール: ブロックチェーン上の実際の取引データ分析
  - マーケットセンチメントツール: 市場の感情と恐怖・欲望指数の分析
  - 評価ツール: プロジェクトやトークンの基本的価値評価
  - オープンインタレストツール: 先物取引のポジション分析

  ガイドライン:
  - 客観的かつバランスの取れた分析を提供する
  - 情報源を明確にし、信頼性を重視する
  - 複数の角度から市場を分析する
  - 長期的な視点と短期的な動向を両方考慮する
  - 過去の分析結果と現在の状況を関連付けて分析する
  - 不確実性やリスクについて明確に言及する

  注意: 投資アドバイスではなく、情報分析と教育目的のサービスとして提供されます。`,

  // OpenAI GPT-4 モデルを使用
  model: openai(aiModel),

  // ツール設定
  tools: {
    newsAnalysisTool,
    onChainDataTool,
    marketSentimentTool,
    evaluationTool,
    openInterestTool,
  },

  // 🚀 メモリ設定を復活（既存Supabaseテーブル統合版）
  memory: memory,
});