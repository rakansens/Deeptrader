// src/mastra/agents/uiControlAgent.ts
// 🎨 実際のUI操作による高度なUIコントロールマスター（WebSocket連携版）
// 更新日: 2025-01-23 - MASTRA v0.10ベストプラクティス準拠 + 既存Supabaseテーブル統合版対応
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { serverEnv } from "@/config/server";
import { logger } from "@/lib/logger";

// 🔧 MASTRAメモリ機能を復活（既存テーブル統合版）
import { Memory } from "@mastra/memory";
import type { MastraMemory } from "@mastra/core";
import SupabaseVectorIntegrated from "../adapters/SupabaseVectorIntegrated";

// 実際のUI操作ツール（WebSocket連携）をインポート
import { 
  realChangeTimeframeTool, 
  realToggleIndicatorTool, 
  realChangeThemeTool, 
  realChangeSymbolTool, 
  realZoomChartTool 
} from "@/mastra/tools/ui/realUITools";

// シミュレーション版ツールもインポート（フォールバック用）
import { 
  changeChartTypeTool, 
  uiActionLoggerTool 
} from "@/mastra/tools/ui";

// 環境変数からAIモデルを取得
const aiModel = serverEnv.AI_MODEL;

// 🚀 メモリ設定（既存Supabaseテーブル統合版）
const memory = new Memory({
  storage: new SupabaseVectorIntegrated({
    lastMessages: 30, // UI操作は頻繁なので少し短めに設定
    semanticRecall: {
      topK: 3,
      messageRange: 1,
    },
  }) as any, // 既存memoriesテーブル活用統合版
  options: {
    lastMessages: 30, // 直近30メッセージを保持
    semanticRecall: {
      topK: 3, // 類似メッセージ上位3件を取得
      messageRange: 1, // 前後1メッセージを含める
    },
  },
}) as unknown as MastraMemory;

/**
 * UIコントロールマスター（実UI操作版）
 * WebSocket連携により実際のUIを制御する専門エージェント
 * 
 * MASTRA v0.10 ベストプラクティス準拠:
 * - Memory機能でコンテキスト保持（既存Supabaseテーブル活用）
 * - 構造化されたツール定義
 * - 詳細なシステムプロンプト
 */
export const uiControlAgent = new Agent({
  name: "UIコントロールマスター（実UI操作版）",
  instructions: `
🎨 **UIコントロールマスター** - あなたは実際のUI操作を行う専門エージェントです

## 🎯 主要機能
WebSocket連携により、実際にユーザーインターフェースを制御します。

### 📊 実際のUI操作ツール（WebSocket連携）
1. **realChangeTimeframeTool** - チャートのタイムフレーム実変更
2. **realToggleIndicatorTool** - インジケーター実表示切り替え  
3. **realChangeThemeTool** - テーマ実変更（ライト/ダーク/自動）
4. **realChangeSymbolTool** - 取引銘柄実変更
5. **realZoomChartTool** - チャートズーム実操作

### 📝 補助ツール
- **uiActionLoggerTool** - UI操作履歴管理
- **changeChartTypeTool** - チャート種類変更（シミュレーション）

## 🔧 操作実行プロセス
1. 自然言語で操作要求を解析
2. 過去の操作履歴を参考にして最適な操作を判断
3. 適切な実UI操作ツールを選択
4. WebSocket経由で実際のUI変更を実行
5. 操作結果をログ記録
6. 成功/失敗状況を報告

## 💬 対応可能な自然言語コマンド例

### 基本操作
- "4時間足に変更して" → realChangeTimeframeTool(timeframe: "4h")
- "ダークテーマにして" → realChangeThemeTool(theme: "dark")
- "ETHUSDTに銘柄変更" → realChangeSymbolTool(symbol: "ETHUSDT")

### 複合操作
- "ダークテーマにしてRSIを表示" → 複数ツール実行
- "1時間足でボリュームインジケーター追加" → 順次実行

### 高度な操作
- "チャートを拡大して詳細表示" → realZoomChartTool(action: "in")
- "画面をフィット表示にリセット" → realZoomChartTool(action: "fit")

## ⚡ WebSocket接続状況の確認
- 各操作前にWebSocket接続状況を確認
- 切断時は適切なエラーメッセージを提供
- 操作成功時は詳細なフィードバックを返却

## 🧠 メモリ活用
- 過去のUI操作設定を記憶
- ユーザーの好みに合わせた操作提案
- 操作パターンの学習と最適化

## 📋 応答形式
\`\`\`
✅ **実UI操作完了**
🔧 実行操作: [操作名]
📊 変更内容: [詳細]
🌐 WebSocket状況: [接続クライアント数]
⏰ 実行時刻: [タイムスタンプ]
🧠 関連する過去操作: [メモリから参照した情報]
📝 次の推奨操作: [提案があれば]
\`\`\`

## 🚨 エラーハンドリング
- WebSocket切断エラー
- 不正なパラメータエラー  
- UI操作実行失敗エラー

常に実際のUI変更を目指し、ユーザーが期待する通りの画面操作を実現してください。
過去の操作履歴を活用して、一貫性のあるUI体験を提供してください。
`,

  // OpenAI GPT-4 モデルを使用
  model: openai(aiModel),

  // ツール設定
  tools: {
    // 実際のUI操作ツール（WebSocket連携）
    realChangeTimeframeTool,
    realToggleIndicatorTool, 
    realChangeThemeTool,
    realChangeSymbolTool,
    realZoomChartTool,
    
    // 補助ツール
    uiActionLoggerTool,
    changeChartTypeTool,
  },

  // 🚀 メモリ設定を復活（既存Supabaseテーブル統合版）
  memory: memory,
});

// エージェント実行ログ
logger.info("🎨 UIコントロールマスター（実UI操作版）が初期化されました", {
  toolCount: Object.keys(uiControlAgent.tools).length,
  realUITools: 5,
  supportTools: 2,
  memoryEnabled: true, // メモリ機能追加
  capabilities: [
    "実際のタイムフレーム変更",
    "実際のインジケーター切り替え", 
    "実際のテーマ変更",
    "実際の銘柄変更",
    "実際のチャートズーム",
    "WebSocket連携",
    "操作履歴管理",
    "メモリ学習機能" // 新機能追加
  ]
});
