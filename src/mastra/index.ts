// src/mastra/index.ts
// Mastra AIエージェントの設定ファイル
import { Mastra } from "@mastra/core";
import { createLogger } from "@mastra/core/logger";

// エージェントのインポート
import { tradingAgent } from "./agents/tradingAgent";
import { researchAgent } from "./agents/researchAgent";
import { uiControlAgent } from "./agents/uiControlAgent";
import { backtestAgent } from "./agents/backtestAgent";
import { unifiedOrchestratorAgent } from "./agents/orchestratorAgent";

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
    uiControlAgent,
    backtestAgent,
    // orchestratorは別途管理（型の互換性問題により）
  },
  // ロガー設定
  logger: createLogger({
    name: "DeepTrader",
    level: "debug",
  }),
});

// エージェント統合エクスポート
export const agents = {
  trading: tradingAgent,
  research: researchAgent,
  ui: uiControlAgent,
  backtest: backtestAgent,
  orchestrator: unifiedOrchestratorAgent,
};
