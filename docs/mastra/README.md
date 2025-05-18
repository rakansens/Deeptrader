# Mastra AIエージェント統合ガイド

## 概要

DeepTraderはMastra AIエージェントを活用して、自然言語によるトレーディング支援を実現します。このドキュメントでは、Mastraエージェントの概要、統合方法、および主要な機能について説明します。

## Mastraとは

Mastraは高度なAIエージェントフレームワークで、自然言語理解、コンテキスト認識、ツール使用能力を備えています。DeepTraderでは、このフレームワークを活用して、ユーザーの自然言語指示をトレーディング操作に変換します。

Mastraは以下の特徴を持つNode.jsベースのフレームワークです：

- AIエージェントの作成・管理
- ツールとエージェントの連携
- ストレージによる会話履歴と文脈管理
- マルチモーダル処理（テキスト、画像、音声）
- MCPプロトコル対応（Model Context Protocol）

## エージェントの作成と設定

DeepTraderでは、以下のようにMastraエージェントを作成・設定します：

```typescript
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { Memory } from "@mastra/memory";
import { tradingTools } from "../tools";

// メモリ設定
const memory = new Memory({
  options: {
    semanticRecall: {
      topK: 5, // 5つの類似メッセージを取得
      messageRange: 2, // 各一致の前後2メッセージを含める
    },
  },
});

// トレーディングエージェントの作成
export const tradingAgent = new Agent({
  name: "TradingAdvisor",
  instructions: `あなたは暗号資産トレーディングの専門家アシスタントです。
  市場分析、チャートパターンの解釈、トレーディング戦略の提案を行います。
  ユーザーに明確で実用的なアドバイスを提供し、トレーディングツールを使用して情報を取得・分析します。`,
  model: openai("gpt-4o"),
  tools: tradingTools,
  memory: memory,
});
```

## メモリシステム

Mastraのメモリシステムは以下の3つの主要コンポーネントで構成されています：

1. **会話履歴**: 直近のメッセージを保持し、短期的なコンテキストを提供
2. **セマンティック検索**: 過去の関連メッセージをベクトル検索で取得
3. **ワーキングメモリ**: システム指示やユーザー情報などの固定コンテキスト

DeepTraderでは、これらの機能を活用して：

- ユーザーの取引履歴や設定を記憶
- 過去の分析結果や取引戦略を参照
- 市場状況の変化に対応した会話の継続性を確保

## MCPツール統合

MCP（Model Context Protocol）を使用して、DeepTraderは様々な外部ツールとAIエージェントを連携させます：

```typescript
import { MCPClient } from "@mastra/mcp";

// MCPクライアントの設定
export const mcp = new MCPClient({
  servers: {
    // チャート分析ツール
    chartAnalysis: {
      command: "npx",
      args: ["tsx", "chart-analysis.ts"],
      env: {
        API_KEY: process.env.CHART_API_KEY,
      },
    },
    // 市場データツール
    marketData: {
      url: new URL("http://localhost:8080/market-data"),
    },
  },
});

// Agent設定時にツールを追加
const agent = new Agent({
  // ...
  tools: await mcp.getTools(),
});
```

## ツール機能

DeepTraderでMastraが使用する主要ツール：

1. **チャート分析ツール**:

   - テクニカルインディケーターの計算と表示
   - チャートパターンの認識
   - サポート/レジスタンスレベルの特定

2. **マーケットデータツール**:

   - リアルタイム価格情報の取得
   - 取引量とマーケットセンチメントの分析
   - 履歴データの検索

3. **トレード実行ツール**:

   - 取引の発注と管理
   - リスク評価と資金管理
   - パフォーマンス追跡

4. **リサーチツール**:
   - ニュースと市場イベントの分析
   - オンチェーンデータの収集
   - 相関資産のトラッキング

## 使用例

以下は、DeepTraderでのMastraエージェントの使用例です：

```typescript
// エージェントの呼び出し（メモリID付き）
const response = await tradingAgent.stream(
  "BTCの現在の状況を分析して、今後24時間の見通しを教えてください",
  {
    resourceId: "user_123",
    threadId: "analysis_session_456",
    maxSteps: 5, // 複数ツール実行ステップを許可
  },
);

// テキストストリームの処理
for await (const chunk of response.textStream) {
  // UIにストリーミング表示
  appendToChat(chunk);
}

// 構造化データの取得
const result = await tradingAgent.generate(
  "BTCの現在のレジスタンスレベルとサポートレベルを示して",
  {
    output: z.object({
      support: z.array(z.number()),
      resistance: z.array(z.number()),
      trend: z.enum(["bullish", "bearish", "neutral"]),
      confidence: z.number().min(0).max(1),
    }),
  },
);
```

## ベストプラクティス

1. **メモリスレッドの管理**:

   - ユーザーごとに`resourceId`を割り当て
   - 分析セッションごとに新しい`threadId`を使用

2. **エラー処理**:

   - ツール実行失敗時のフォールバック戦略を実装
   - エージェント応答のバリデーション

3. **パフォーマンス最適化**:

   - 必要に応じてセマンティック検索を無効化
   - 長期実行ツールには非同期パターンを使用

4. **UX考慮事項**:
   - ストリーミング応答でリアルタイムフィードバックを提供
   - ツール使用中のインジケーターを表示

## 環境設定

DeepTraderをローカル開発環境で実行するには：

```bash
# Mastra依存関係のインストール
npm install @mastra/core @mastra/memory @mastra/mcp @ai-sdk/openai zod

# 開発サーバーの起動
npm run dev

# または特定のエージェントのみのテスト
mastra dev --agent tradingAgent
```

## 主要機能

### 1. 自然言語理解

- ユーザーの意図を理解し、適切なアクションに変換
- 曖昧な指示の明確化（例：「BTCの分析をして」→「時間枠、分析タイプなどの詳細を確認」）
- マルチターン会話の維持

### 2. マルチモーダル処理

- テキスト入力の処理
- チャート画像の分析
- 音声入力の処理と応答

### 3. トレーディングツール統合

- チャート操作（時間枠変更、インジケーター追加など）
- 市場データ取得
- 取引実行

### 4. 知識ベース

- 暗号資産市場の知識
- トレーディング戦略
- テクニカル分析パターン
- 経済指標と影響

### 5. メモリとコンテキスト管理

- 会話履歴の保存
- ユーザー設定の記憶
- 過去の分析結果の参照

## 統合アーキテクチャ

```
+-------------------+    +-------------------+    +-------------------+
|                   |    |                   |    |                   |
|   フロントエンド   |--->|   Mastraエージェント |<-->|   外部API/サービス |
|   (Next.js)       |    |   (AI処理エンジン)  |    |   (取引所など)     |
|                   |    |                   |    |                   |
+-------------------+    +-------------------+    +-------------------+
          ^                       |
          |                       v
+-------------------+    +-------------------+
|                   |    |                   |
|   ユーザー入出力   |    |   データストア    |
|   (チャット/音声)  |    |   (Supabase)     |
|                   |    |                   |
+-------------------+    +-------------------+
```

## 実装手順

### 1. Mastraのセットアップ

```bash
# Mastraパッケージのインストール
npm install @mastra/core @mastra/client-js

# 必要に応じて追加パッケージをインストール
npm install @mastra/memory @mastra/tools
```

### 2. エージェント定義

```typescript
import { Agent, createAgent } from "@mastra/core";
import { createMemory } from "@mastra/memory";
import { tradingTools } from "./tools";

export async function createTradingAgent() {
  const agent = await createAgent({
    name: "DeepTraderAgent",
    description: "暗号資産トレーディングの支援を行うAIアシスタント",
    model: process.env.AI_MODEL,
    memory: createMemory({
      type: "postgres",
      connectionString: process.env.SUPABASE_URL,
    }),
    tools: tradingTools,
    // エージェントの追加設定
  });

  return agent;
}
```

### 3. ツール定義例

```typescript
// tools.ts
import { defineTool } from "@mastra/core";

export const tradingTools = [
  defineTool({
    name: "switchTimeframe",
    description: "チャートの時間枠を変更する",
    parameters: {
      timeframe: {
        type: "string",
        enum: ["1m", "5m", "15m", "1h", "4h", "1d", "1w", "1M"],
        description: "表示する時間枠",
      },
    },
    handler: async ({ timeframe }) => {
      // 時間枠変更のロジック
      return { success: true, message: `時間枠を${timeframe}に変更しました` };
    },
  }),

  defineTool({
    name: "analyzeTechnical",
    description: "テクニカル分析を実行する",
    parameters: {
      symbol: { type: "string", description: "分析する銘柄のシンボル" },
      indicators: {
        type: "array",
        items: { type: "string" },
        description: "使用するインジケーター",
      },
    },
    handler: async ({ symbol, indicators }) => {
      // テクニカル分析のロジック
      return {
        analysis: "分析結果...",
        recommendations: ["推奨アクション..."],
      };
    },
  }),

  // その他のツール定義...
];
```

### 4. フロントエンド統合

```typescript
// app/chat/page.tsx
'use client';

import { useState } from 'react';
import { useMastraAgent } from '@mastra/client-js';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const { sendMessage, isLoading } = useMastraAgent({
    agentId: 'trading-agent',
    onMessage: (message) => {
      setMessages((prev) => [...prev, message]);
    }
  });

  const handleSend = async () => {
    if (!input.trim()) return;

    // ユーザーメッセージの追加
    setMessages((prev) => [...prev, { role: 'user', content: input }]);

    // エージェントへのメッセージ送信
    await sendMessage(input);

    // 入力欄のクリア
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* チャット表示エリア */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* 入力エリア */}
      <div className="border-t p-4">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="トレーディングについて質問してください..."
            className="flex-1 border p-2 rounded-l"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-blue-500 text-white p-2 rounded-r"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 高度な機能

### 1. ストリーミングレスポンス

```typescript
const { sendStreamingMessage } = useMastraAgent({
  agentId: "trading-agent",
  streaming: true,
  onStreamingChunk: (chunk) => {
    // ストリーミング中のUIアップデート
  },
  onStreamingComplete: (fullResponse) => {
    // ストリーミング完了時の処理
  },
});
```

### 2. コンテキスト強化

```typescript
await sendMessage(input, {
  context: {
    currentSymbol: 'BTC/USDT',
    timeframe: '1h',
    accountBalance: 10000,
    positions: [...],
    // その他の文脈情報
  }
});
```

### 3. マルチモーダル入力

```typescript
await sendMessage([
  { type: "text", content: "このチャートパターンについて分析してください" },
  { type: "image", url: chartImageUrl },
]);
```

## 運用とモニタリング

- Mastraのロギング機能を活用したエージェントの行動追跡
- エージェントのパフォーマンス監視
- ユーザーフィードバックの収集と改善サイクルの実装

## 参考リソース

- [Mastra公式ドキュメント](https://mastra.ai/docs)
- [APIリファレンス](https://mastra.ai/docs/api)
- [サンプルプロジェクト](https://github.com/mastra-ai/examples)
