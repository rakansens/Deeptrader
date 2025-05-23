// src/mastra/agents/tradingAgent.ts
// トレーディングアドバイザーエージェントの定義（MASTRA v0.10 ベストプラクティス準拠）
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { AI_MODEL } from "@/lib/env";
import { z } from "zod";

// 🔧 MASTRAメモリ機能を復活
import { Memory } from "@mastra/memory";
import type { MastraMemory } from "@mastra/core";
import { TIMEFRAMES, type Timeframe } from "@/constants/chart";
import SupabaseVectorStorage from "../adapters/SupabaseVector";

// ツールのインポート
import { chartAnalysisTool } from "../tools/chartAnalysisTool";
import { marketDataTool } from "../tools/marketDataTool";
import { tradingExecutionTool } from "../tools/tradingExecutionTool";
import { entrySuggestionTool } from "../tools/entrySuggestionTool";

// 使用するAIモデルを環境変数から取得
const aiModel = AI_MODEL;

// 🚀 メモリ設定（MASTRA v0.10 ベストプラクティス完全版）
const memory = new Memory({
  storage: new SupabaseVectorStorage({
    lastMessages: 40,
    semanticRecall: {
      topK: 5,
      messageRange: 2,
    },
  }) as any, // 完全SupabaseVectorストレージ使用
  options: {
    lastMessages: 40, // 直近40メッセージを保持
    semanticRecall: {
      topK: 5, // 類似メッセージ上位5件を取得
      messageRange: 2, // 前後2メッセージを含める
    },
  },
}) as unknown as MastraMemory;

// TIMEFRAMESをZodのenumで使用できるように変換
const timeframeEnum = z.enum(TIMEFRAMES as [Timeframe, ...Timeframe[]]);

// 市場分析結果のスキーマ定義
export const marketAnalysisSchema = z.object({
  trend: z.enum(["bullish", "bearish", "neutral", "uncertain"]),
  supportLevels: z.array(z.number()),
  resistanceLevels: z.array(z.number()),
  keyPatterns: z.array(z.string()),
  riskLevel: z.enum(["low", "medium", "high", "extreme"]),
  timeframe: timeframeEnum,
  summary: z.string(),
});

// トレーディング戦略のスキーマ定義
export const tradingStrategySchema = z.object({
  action: z.enum(["buy", "sell", "hold", "wait"]),
  entryPoints: z.array(z.number()).optional(),
  stopLoss: z.number().optional(),
  takeProfit: z.array(z.number()).optional(),
  timeframe: timeframeEnum,
  reasoning: z.string(),
  alternativeScenarios: z.array(z.string()).optional(),
});

/**
 * トレーディングアドバイザーエージェント
 * 市場分析、チャートパターンの解釈、トレーディング戦略の提案を行います
 * 
 * MASTRA v0.10 ベストプラクティス準拠:
 * - Memory機能でコンテキスト保持
 * - 構造化されたツール定義
 * - 詳細なシステムプロンプト
 * - Zodスキーマによる型安全性
 */
export const tradingAgent = new Agent({
  name: "トレーディングアドバイザー",
  instructions: `あなたは暗号資産トレーディングの専門家アシスタントです。
  
  あなたの役割:
  - ユーザーからの市場分析リクエストに応える
  - チャートパターン、テクニカル指標の解釈を提供する
  - トレーディング戦略を提案する
  - ユーザーの取引を支援する
  
  使用可能なツール:
  - チャート分析ツール: チャートの読み取り、パターン認識、テクニカル指標の計算
  - 市場データツール: 現在の価格、取引量、その他の市場データの取得
  - トレード実行ツール: ユーザーの承認を得て取引を実行
  - エントリー提案ツール: RSIに基づき売買エントリー候補を提示
  
  ガイドライン:
  - 常に明確で実用的なアドバイスを提供する
  - リスク管理の重要性を強調する
  - すべての分析に根拠を示す
  - ユーザーの経験レベルに合わせて説明の詳細度を調整する
  - 確実でない情報には適切な注釈をつける
  - 過去の会話履歴を参考にして一貫性のあるアドバイスを提供する
  
  注意: 財務アドバイスではなく、情報提供と教育目的のツールとしてのみ機能します。
  
  市場分析出力形式:
  市場分析を行う場合は、以下の構造に従って情報を整理してください:
  - トレンド: [bullish/bearish/neutral/uncertain]
  - サポートレベル: [数値の配列]
  - レジスタンスレベル: [数値の配列]
  - 主要パターン: [文字列の配列]
  - リスクレベル: [low/medium/high/extreme]
  - タイムフレーム: [文字列]
  - 要約: [文字列]
  
  トレーディング戦略出力形式:
  トレーディング戦略を提案する場合は、以下の構造に従ってください:
  - アクション: [buy/sell/hold/wait]
  - エントリーポイント: [数値の配列]（オプション）
  - ストップロス: [数値]（オプション）
  - 利確目標: [数値の配列]（オプション）
  - タイムフレーム: [文字列]
  - 理由: [文字列]
  - 代替シナリオ: [文字列の配列]（オプション）
  `,

  // OpenAI GPT-4 モデルを使用
  model: openai(aiModel),

  // ツール設定
  tools: {
    chartAnalysisTool,
    marketDataTool,
    tradingExecutionTool,
    entrySuggestionTool,
  },

  // 🚀 メモリ設定を復活（MASTRAベストプラクティス）
  memory: memory,
});
