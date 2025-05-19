// src/mastra/index.ts
// Mastra AIエージェントの設定ファイル
import { Mastra } from "@mastra/core";
import { createLogger } from "@mastra/core/logger";

// エージェントのインポート
import { tradingAgent } from "./agents/tradingAgent";
import { researchAgent } from "./agents/researchAgent";
import { orchestratorAgent } from "./agents/orchestratorAgent";

/**
 * Mastraインスタンスの作成
 * このインスタンスはアプリケーション全体で使用され、
 * すべてのエージェントとツールの設定を管理します
 */
export const mastra = new Mastra({
  // 登録するエージェント
  agents: {
    tradingAgent,
    researchAgent,
    orchestratorAgent,
  },
  // ロガー設定
  logger: createLogger({
    name: "DeepTrader",
    level: "debug",
  }),
});
