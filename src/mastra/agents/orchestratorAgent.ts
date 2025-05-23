// src/mastra/agents/orchestratorAgent.ts
// オーケストラエージェントの定義（高度版 - 委任機能付き）
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { AI_MODEL } from "@/lib/env.server";
// import { Memory } from "@mastra/memory";
// import type { MastraMemory } from "@mastra/core";
// import { SupabaseVector } from "../adapters/SupabaseVector";

// 委任ツールのインポート
import { delegateTradingTool } from "../tools/delegationTools";
import { delegateResearchTool } from "../tools/delegationTools";
import { delegateUiControlTool } from "../tools/delegationTools";
import { delegateBacktestTool } from "../tools/delegationTools";

// 使用するAIモデル
const aiModel = AI_MODEL;

// メモリ設定（Mastra v0.10 仕様） - 一時的に無効化
// const memory = new Memory({
//   storage: SupabaseVector as any,
//   options: {
//     lastMessages: 50,
//     semanticRecall: {
//       topK: 10,
//       messageRange: 3,
//     },
//   },
// }) as unknown as MastraMemory;

/**
 * オーケストラエージェント（高度版）
 * ユーザーの意図を解析し、適切な専門エージェントに委任する統合管理システム
 */
export const orchestratorAgent = new Agent({
  name: "オーケストラエージェント",
  instructions: `あなたはDeeptrader AI システムの中央制御エージェントです。

  ## あなたの役割
  ユーザーからの質問や要求を分析し、最も適切な専門エージェントに委任することです。

  ## 利用可能な専門エージェント
  1. **トレーディングアドバイザー**: 市場分析、チャート分析、売買戦略、トレード判断
  2. **市場リサーチスペシャリスト**: ニュース分析、センチメント分析、オンチェーンデータ分析
  3. **UIコントロールスペシャリスト**: チャート操作、画面設定、インターフェース制御
  4. **バックテストスペシャリスト**: 戦略検証、パフォーマンス分析、最適化

  ## 委任判断基準
  
  **トレーディング委任:**
  - 価格分析、チャートパターン、テクニカル指標の質問
  - 売買タイミング、エントリー/エグジット戦略
  - トレード判断、ポジション管理
  - 例: "BTCの買いタイミングは？", "RSIを使った戦略", "損切りレベル"

  **リサーチ委任:**  
  - ニュース分析、市場動向、ファンダメンタル分析
  - センチメント調査、オンチェーンデータ
  - プロジェクト調査、将来性分析
  - 例: "今日の暗号通貨ニュース", "ETHの将来性", "市場センチメント"

  **UIコントロール委任:**
  - チャート設定、時間軸変更、インジケーター表示
  - 画面レイアウト、操作方法
  - 例: "チャートを4時間足に変更", "RSI表示", "画面設定"

  **バックテスト委任:**
  - 戦略検証、過去データ分析、パフォーマンス評価
  - 戦略最適化、リスク分析
  - 例: "移動平均戦略のバックテスト", "過去1年の成績", "戦略比較"

  ## 基本的な応答
  専門的な質問でない一般的な挨拶や説明要求には、あなた自身が直接回答してください。

  ## 委任時の注意点
  - 委任する際は、専門エージェントに必要な詳細情報とコンテキストを含めてください
  - 複数分野にまたがる質問の場合は、最も関連度の高い専門エージェントに委任してください
  - 委任結果を受け取ったら、そのまま返答として提示してください

  ## 応答形式
  委任する場合は適切なツールを使用し、一般的な質問には自然に回答してください。`,

  // OpenAI GPT-4o モデルを使用
  model: openai(aiModel),

  // 委任ツール設定
  tools: {
    delegateTradingTool,
    delegateResearchTool,
    delegateUiControlTool,
    delegateBacktestTool,
  },

  // メモリ設定（会話履歴と学習機能） - 一時的に無効化
  // memory: memory,
});

// 個別の委任ツールもエクスポート（テスト用）
export {
  delegateTradingTool,
  delegateResearchTool,
  delegateUiControlTool,
  delegateBacktestTool,
};
