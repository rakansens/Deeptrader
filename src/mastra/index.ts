// src/mastra/index.ts
// Mastra AIエージェントの設定ファイル
import { Mastra } from "@mastra/core";
import { createLogger } from "@mastra/core/logger";

// エージェントのインポート
import { tradingAgent } from "./agents/tradingAgent";
import { researchAgent } from "./agents/researchAgent";

// MCPサーバー設定のインポート
import { tradingToolsServer } from "./mcp/servers";

/**
 * Mastraインスタンスの作成
 * このインスタンスはアプリケーション全体で使用され、
 * すべてのエージェントとツールの設定を管理します
 */
export const mastra = new Mastra({
  // 登録するエージェント
  agents: { 
    tradingAgent,
    researchAgent 
  },
  // ロガー設定
  logger: createLogger({ 
    name: "DeepTrader", 
    level: "debug" 
  }),
  // MCPサーバー設定
  mcpServers: {
    tradingToolsServer
  },
  // ミドルウェア設定（必要に応じて）
  serverMiddleware: [
    {
      handler: (c, next) => {
        console.log("リクエスト受信:", c.request.url);
        return next();
      },
    },
  ],
}); 