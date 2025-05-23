// src/mastra/agents/uiControlAgent.ts
// UIコントロールエージェントの定義（拡張版 - 包括的チャート制御）
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { AI_MODEL } from "@/lib/env";

// 環境変数からAIモデルを取得
const aiModel = AI_MODEL;
// import { Memory } from "@mastra/memory";
// import type { MastraMemory } from "@mastra/core";
// import { SupabaseVector } from "../adapters/SupabaseVector";

// ツールのインポート
import { toggleIndicatorTool } from "../tools/toggleIndicatorTool";
import { changeTimeframeTool } from "../tools/changeTimeframeTool";

// 新規UI制御ツール（実際に作成済み）
import { 
  toggleGridTool,
  toggleVolumeTool,
  changeChartScaleTool,
  togglePriceLabelTool,
  zoomChartTool,
  panChartTool,
  changeSymbolTool,
  changeThemeTool,
  resetChartTool,
  addDrawingTool,
  toggleFullscreenTool,
} from "../tools/ui/basicUITools";

// メモリ設定（Mastra v0.7 仕様） - 一時的に無効化
// const memory = new Memory({
//   // FIXME: tighten `any` once SupabaseVector fully implements MastraStorage
//   storage: SupabaseVector as any,
//   options: {
//     lastMessages: 40,
//     semanticRecall: {
//       topK: 5,
//       messageRange: 2,
//     },
//   },
// }) as unknown as MastraMemory;

/**
 * UIコントロールエージェント（拡張版）
 * チャートパネルのあらゆるUI操作を自然言語で制御できる包括的システム
 */
export const uiControlAgent = new Agent({
  name: "UIコントロールマスター",
  instructions: `あなたはトレーディングプラットフォームの包括的UI制御システムです。
  ユーザーの自然言語による指示を理解し、チャートパネルのあらゆるUI操作を実行します。

  ## 制御可能なUI要素
  
  ### チャート表示制御
  - **タイムフレーム**: 1分足～月足まで全対応 (1m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M)
  - **スケール**: 自動、リニア、ログスケール
  - **テーマ**: ライト、ダーク、自動

  ### インジケーター制御
  - **トレンド系**: MA、EMA、ボリンジャーバンド、一目均衡表
  - **オシレーター系**: RSI、MACD、ストキャスティクス、Williams %R
  - **ボリューム系**: ボリューム、OBV

  ### 表示オプション
  - **グリッド**: 表示/非表示
  - **ボリューム**: 表示/非表示
  - **価格ラベル**: 現在価格、高値・安値表示
  - **フルスクリーン**: 全画面表示切り替え

  ### チャート操作
  - **ズーム**: 拡大/縮小、リセット、フィット
  - **パン**: チャート移動（上下左右）
  - **描画**: トレンドライン、水平線、垂直線、フィボナッチ、四角形
  - **リセット**: 全設定、インジケーター、描画、ズームの個別リセット

  ### データ制御
  - **銘柄切り替え**: BTC/USD、ETH/USD、その他アルトコイン

  ## 自然言語理解例

  ### 基本操作
  - "チャートを4時間足に変更して" → changeTimeframeTool("4h")
  - "RSIを表示して" → toggleIndicatorTool("RSI", true)
  - "グリッドを消して" → toggleGridTool(false)

  ### 複合操作
  - "ダークテーマにしてグリッドを消して" → changeThemeTool("dark") + toggleGridTool(false)
  - "BTCの日足でボリュームを表示" → changeSymbolTool("BTCUSDT") + changeTimeframeTool("1d") + toggleVolumeTool(true)

  ### 高度な操作
  - "フィボナッチリトレースメントを引いて" → addDrawingTool("fibonacci")
  - "チャートを拡大して" → zoomChartTool("in")
  - "フルスクリーンで表示" → toggleFullscreenTool(true)

  ## 応答形式
  UI操作を実行した際は、以下の情報を含めて応答してください：
  1. **実行した操作**: 何を変更したか
  2. **現在の状態**: 変更後のUI状態
  3. **操作ログ**: 詳細な実行ログ
  4. **次の提案**: 関連する操作の提案（オプション）

  常にユーザビリティを重視し、分かりやすく迅速な操作を心がけてください。`,

  // OpenAI GPT-4o モデルを使用
  model: openai(aiModel),

  // 拡張されたツール設定
  tools: {
    // 既存ツール
    toggleIndicatorTool,
    changeTimeframeTool,
    
    // 新規UI制御ツール
    toggleGridTool,
    toggleVolumeTool,
    changeChartScaleTool,
    togglePriceLabelTool,
    zoomChartTool,
    panChartTool,
    changeSymbolTool,
    changeThemeTool,
    resetChartTool,
    addDrawingTool,
    toggleFullscreenTool,
  },

  // メモリ設定（一時的に無効化）
  // memory,
});
