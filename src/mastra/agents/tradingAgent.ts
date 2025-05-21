// src/mastra/agents/tradingAgent.ts
// トレーディングアドバイザーエージェントの定義
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";

// 使用するAIモデルを環境変数から取得。未指定の場合は gpt-4o
const aiModel = process.env.AI_MODEL ?? 'gpt-4o';
import { Memory } from "@mastra/memory";
import type { MastraMemory } from "@mastra/core";
import { z } from "zod";
import { TIMEFRAMES } from "@/constants/chart";

// ツールのインポート
import { chartAnalysisTool } from "../tools/chartAnalysisTool";
import { marketDataTool } from "../tools/marketDataTool";
import { tradingExecutionTool } from "../tools/tradingExecutionTool";
import { entrySuggestionTool } from "../tools/entrySuggestionTool";

// メモリ設定
const memory = new Memory({
  options: {
    // 最新の40メッセージを保持
    lastMessages: 40,
    // セマンティック検索設定
    semanticRecall: {
      topK: 5, // 5つの類似メッセージを取得
      messageRange: 2, // 各一致の前後2メッセージを含める
    },
  },
}) as unknown as MastraMemory;

// 市場分析結果のスキーマ定義
export const marketAnalysisSchema = z.object({
  trend: z.enum(["bullish", "bearish", "neutral", "uncertain"]),
  supportLevels: z.array(z.number()),
  resistanceLevels: z.array(z.number()),
  keyPatterns: z.array(z.string()),
  riskLevel: z.enum(["low", "medium", "high", "extreme"]),
  timeframe: z.enum(TIMEFRAMES),
  summary: z.string(),
});

// トレーディング戦略のスキーマ定義
export const tradingStrategySchema = z.object({
  action: z.enum(["buy", "sell", "hold", "wait"]),
  entryPoints: z.array(z.number()).optional(),
  stopLoss: z.number().optional(),
  takeProfit: z.array(z.number()).optional(),
  timeframe: z.enum(TIMEFRAMES),
  reasoning: z.string(),
  alternativeScenarios: z.array(z.string()).optional(),
});

/**
 * トレーディングアドバイザーエージェント
 * 市場分析、チャートパターンの解釈、トレーディング戦略の提案を行います
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

  // メモリ設定
  memory: memory,
});
