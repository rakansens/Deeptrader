# 🧪 Deeptrader AIテストスイート

このディレクトリには、Deeptrader AIシステムの各種テストが整理されています。

## 📁 ディレクトリ構造

```
tests/
├── integration/     # 統合テスト
├── scripts/         # テストスクリプト・ユーティリティ
├── websocket/       # WebSocket/Socket.IO関連テスト
└── README.md        # このファイル
```

## 🚀 テスト実行方法

### Jest単体テスト
```bash
# 基本テスト実行
npm run test

# ウォッチモード
npm run test:watch

# カバレッジ付き
npm run test:coverage

# ユニットテストのみ
npm run test:unit
```

### 統合テスト
```bash
# UI操作統合テスト
npm run test:integration

# ETH切り替えテスト
npm run test:eth-switch
```

### WebSocket関連テスト
```bash
# Socket.IOサーバー起動
npm run socket:start

# WebSocketクライアントテスト
npm run test:websocket

# UI操作コマンド送信テスト
npm run socket:test
```

## 📋 テストファイル一覧

### integration/
- `test-ui-agent-integration.mjs` - UI操作エージェント統合テスト
- `test-eth-switch.mjs` - 銘柄切り替え機能テスト
- `test-simple-ui-server.mjs` - UIサーバー基本動作テスト
- `test-websocket-server.mjs` - WebSocketサーバーテスト
- `test-websocket-client.mjs` - WebSocketクライアントテスト

### scripts/
- `send-ui-command.mjs` - UI操作コマンド送信スクリプト

### websocket/
- `websocket-ui-client.mjs` - WebSocket UIクライアント

## 🎯 テスト目的

- **ユニットテスト**: 個別コンポーネント・関数の動作確認
- **統合テスト**: MASTRA多エージェント委任システムの動作確認
- **Socket.IOテスト**: リアルタイムUI操作の動作確認
- **End-to-Endテスト**: フロントエンドからバックエンドまでの完全な動作確認

## 🔧 テスト環境設定

テスト実行前に以下を確認：

1. **OpenAI API KEY**: 環境変数設定済み
2. **Next.js開発サーバー**: `npm run dev` で起動済み
3. **Socket.IOサーバー**: `npm run socket:start` で起動済み

## 📊 テストカバレッジ目標

- **ユニットテスト**: 80%以上
- **統合テスト**: 主要フロー100%
- **MASTRA委任システム**: 全エージェント動作確認
- **UI操作**: 全5種類の操作実行確認 