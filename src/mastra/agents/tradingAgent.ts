// src/mastra/agents/tradingAgent.ts
// トレーディングアドバイザーエージェントの定義
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { Memory } from "@mastra/memory";
import { z } from "zod";

// ツールのインポート
import { chartAnalysisTool } from "../tools/chartAnalysisTool";
import { marketDataTool } from "../tools/marketDataTool";
import { tradingExecutionTool } from "../tools/tradingExecutionTool";

// メモリ設定
const memory = new Memory({
  options: {
    // 最新の40メッセージを保持
    lastMessages: 40,
    // セマンティック検索設定
    semanticRecall: {
      topK: 5,        // 5つの類似メッセージを取得
      messageRange: 2  // 各一致の前後2メッセージを含める
    }
  }
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
  
  ガイドライン:
  - 常に明確で実用的なアドバイスを提供する
  - リスク管理の重要性を強調する
  - すべての分析に根拠を示す
  - ユーザーの経験レベルに合わせて説明の詳細度を調整する
  - 確実でない情報には適切な注釈をつける
  
  注意: 財務アドバイスではなく、情報提供と教育目的のツールとしてのみ機能します。`,
  
  // OpenAI GPT-4 モデルを使用
  model: openai("gpt-4o"),
  
  // ツール設定
  tools: {
    chartAnalysisTool,
    marketDataTool,
    tradingExecutionTool
  },
  
  // メモリ設定
  memory: memory,
  
  // 構造化出力スキーマの定義
  outputSchemas: {
    // 市場分析結果のスキーマ
    marketAnalysis: z.object({
      trend: z.enum(["bullish", "bearish", "neutral", "uncertain"]),
      supportLevels: z.array(z.number()),
      resistanceLevels: z.array(z.number()),
      keyPatterns: z.array(z.string()),
      riskLevel: z.enum(["low", "medium", "high", "extreme"]),
      timeframe: z.string(),
      summary: z.string()
    }),
    
    // トレーディング戦略のスキーマ
    tradingStrategy: z.object({
      action: z.enum(["buy", "sell", "hold", "wait"]),
      entryPoints: z.array(z.number()).optional(),
      stopLoss: z.number().optional(),
      takeProfit: z.array(z.number()).optional(),
      timeframe: z.string(),
      reasoning: z.string(),
      alternativeScenarios: z.array(z.string()).optional()
    })
  }
}); 