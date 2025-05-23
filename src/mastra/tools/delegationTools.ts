// src/mastra/tools/delegationTools.ts
// オーケストラエージェントが各専門エージェントに委任するためのツール

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { tradingAgent } from "../agents/tradingAgent";
import { researchAgent } from "../agents/researchAgent";
import { uiControlAgent } from "../agents/uiControlAgent";
import { backtestAgent } from "../agents/backtestAgent";
import { logger } from "@/lib/logger";

/**
 * トレーディングエージェントに委任するツール
 */
export const delegateTradingTool = createTool({
  id: "delegate_trading",
  description: "市場分析、チャート分析、トレード戦略、売買判断に関する質問をトレーディング専門エージェントに委任します",
  inputSchema: z.object({
    query: z.string().describe("トレーディングに関する質問やリクエスト"),
    context: z.string().optional().describe("追加のコンテキスト情報"),
  }),
  execute: async ({ context }) => {
    try {
      logger.info("🔀 トレーディングエージェントに委任:", context.query.substring(0, 100));
      
      const fullQuery = context.context ? `${context.context}\n\n${context.query}` : context.query;
      const result = await tradingAgent.generate(fullQuery);
      
      return {
        success: true,
        agent: "トレーディングアドバイザー",
        response: result,
        delegationType: "trading_analysis"
      };
    } catch (error) {
      logger.error("トレーディングエージェント委任エラー:", error);
      return {
        success: false,
        agent: "トレーディングアドバイザー", 
        error: error instanceof Error ? error.message : "不明なエラー",
        delegationType: "trading_analysis"
      };
    }
  },
});

/**
 * リサーチエージェントに委任するツール
 */
export const delegateResearchTool = createTool({
  id: "delegate_research",
  description: "市場調査、ニュース分析、オンチェーンデータ分析、センチメント分析に関する質問をリサーチ専門エージェントに委任します",
  inputSchema: z.object({
    query: z.string().describe("リサーチに関する質問やリクエスト"),
    context: z.string().optional().describe("追加のコンテキスト情報"),
  }),
  execute: async ({ context }) => {
    try {
      logger.info("🔀 リサーチエージェントに委任:", context.query.substring(0, 100));
      
      const fullQuery = context.context ? `${context.context}\n\n${context.query}` : context.query;
      const result = await researchAgent.generate(fullQuery);
      
      return {
        success: true,
        agent: "市場リサーチスペシャリスト",
        response: result,
        delegationType: "research_analysis"
      };
    } catch (error) {
      logger.error("リサーチエージェント委任エラー:", error);
      return {
        success: false,
        agent: "市場リサーチスペシャリスト",
        error: error instanceof Error ? error.message : "不明なエラー", 
        delegationType: "research_analysis"
      };
    }
  },
});

/**
 * UIコントロールエージェントに委任するツール
 */
export const delegateUiControlTool = createTool({
  id: "delegate_ui_control",
  description: "チャート操作、UI設定、画面制御に関する質問をUIコントロール専門エージェントに委任します",
  inputSchema: z.object({
    query: z.string().describe("UIコントロールに関する質問やリクエスト"),
    context: z.string().optional().describe("追加のコンテキスト情報"),
  }),
  execute: async ({ context }) => {
    try {
      logger.info("🔀 UIコントロールエージェントに委任:", context.query.substring(0, 100));
      
      const fullQuery = context.context ? `${context.context}\n\n${context.query}` : context.query;
      const result = await uiControlAgent.generate(fullQuery);
      
      return {
        success: true,
        agent: "UIコントロールスペシャリスト",
        response: result,
        delegationType: "ui_control"
      };
    } catch (error) {
      logger.error("UIコントロールエージェント委任エラー:", error);
      return {
        success: false,
        agent: "UIコントロールスペシャリスト",
        error: error instanceof Error ? error.message : "不明なエラー",
        delegationType: "ui_control"
      };
    }
  },
});

/**
 * バックテストエージェントに委任するツール
 */
export const delegateBacktestTool = createTool({
  id: "delegate_backtest",
  description: "トレード戦略のバックテスト、パフォーマンス分析、戦略最適化に関する質問をバックテスト専門エージェントに委任します",
  inputSchema: z.object({
    query: z.string().describe("バックテストに関する質問やリクエスト"),
    context: z.string().optional().describe("追加のコンテキスト情報"),
  }),
  execute: async ({ context }) => {
    try {
      logger.info("🔀 バックテストエージェントに委任:", context.query.substring(0, 100));
      
      const fullQuery = context.context ? `${context.context}\n\n${context.query}` : context.query;
      const result = await backtestAgent.generate(fullQuery);
      
      return {
        success: true,
        agent: "バックテストスペシャリスト",
        response: result,
        delegationType: "backtest_analysis"
      };
    } catch (error) {
      logger.error("バックテストエージェント委任エラー:", error);
      return {
        success: false,
        agent: "バックテストスペシャリスト",
        error: error instanceof Error ? error.message : "不明なエラー",
        delegationType: "backtest_analysis"
      };
    }
  },
}); 