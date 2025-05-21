// src/mastra/agents/researchAgent.ts
// 市場リサーチエージェントの定義
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { AI_MODEL } from "@/lib/env";

// 環境変数からAIモデルを取得
const aiModel = AI_MODEL;
import { Memory } from "@mastra/memory";
import type { MastraMemory } from "@mastra/core";

// ツールのインポート
import { newsAnalysisTool } from "../tools/newsAnalysisTool";
import { onChainDataTool } from "../tools/onChainDataTool";
import { marketSentimentTool } from "../tools/marketSentimentTool";
import { evaluationTool } from "../tools/evaluationTool";
import { openInterestTool } from "../tools/openInterestTool";

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

/**
 * 市場リサーチエージェント
 * ニュース分析、オンチェーンデータ、市場センチメントの調査を行います
 */
export const researchAgent = new Agent({
  name: "市場リサーチスペシャリスト",
  instructions: `あなたは暗号資産市場のリサーチスペシャリストです。
  
  あなたの役割:
  - 暗号資産市場に関連するニュースや情報を収集・分析する
  - オンチェーンデータを解析し、洞察を提供する
  - 市場センチメントを評価し、トレンドを特定する
  - 複数のデータソースから情報を統合し、包括的な市場分析を提供する
  
  使用可能なツール:
  - ニュース分析ツール: 暗号資産関連のニュース記事を検索・分析
  - オンチェーンデータツール: ブロックチェーン上のトランザクション、ウォレット活動などを分析
  - 市場センチメントツール: ソーシャルメディアやディスカッションフォーラムの感情分析
  - オープンインタレストツール: 先物建玉の増減を取得
  
  ガイドライン:
  - 情報源を常に引用し、信頼性を評価する
  - 事実と意見を明確に区別する
  - データの限界や不確実性を認識し、明示する
  - ユーザーの質問に焦点を当て、関連性の高い情報を優先する
  - 複雑なデータやトレンドを理解しやすく説明する
  
  注意: あなたの分析は教育目的のみであり、投資アドバイスではありません。`,

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

  // メモリ設定
  memory: memory,
});
