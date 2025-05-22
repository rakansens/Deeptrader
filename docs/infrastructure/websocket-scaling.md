# WebSocketスケーリング戦略

DeepTrader では Binance をはじめとする取引所の WebSocket ストリームを利用してリアルタイム情報を取得します。ユーザー数の増加に伴う接続数の肥大化を防ぐため、段階的なスケーリング戦略を採用します。

## フェーズ 1: PoC

最初の段階ではブラウザから直接 Binance の WebSocket に接続し、機能検証を行います。`BinanceSocketManager` を用いて接続の確立と再接続を管理します。

### マイルストーン

- WebSocket 接続と受信データの検証
- 最低限のリコネクト・Ping 実装

```
+------------------+        +---------------------+
|   Next.js Client | <----> | Binance WebSocket   |
+------------------+        +---------------------+
```

## フェーズ 2: サーバーサイド Hub

複数ユーザーが同じストリームを購読するケースに備え、サーバーサイドに中継 Hub を設置します。クライアントは Hub とだけ接続し、Hub から取引所への接続数を集約します。

### マイルストーン

- Hub サーバーの立ち上げ（Node.js / Next.js API）
- クライアントから Hub への WebSocket 接続
- Hub から Binance への単一接続とメッセージブロードキャスト

```
+------------------+        +--------------+        +---------------------+
|   Next.js Client | <----> | Socket Hub   | <----> | Binance WebSocket   |
+------------------+        +--------------+        +---------------------+
```

## フェーズ 3: フルスケール

接続規模が大きくなった場合は、Hub をコンテナ化し水平スケーリングできるようにします。メッセージキューを介して複数インスタンス間でイベントを共有し、他の取引所にも対応可能な構成へ拡張します。

### マイルストーン

- Hub コンテナのオーケストレーション（Kubernetes 等）
- Redis などのメッセージキュー導入
- マルチ取引所対応とストリーム管理

```
+------------------+        +---------------------+        +------------------+
|   Next.js Client | <----> | WS Gateway Cluster  | <----> | Exchange Streams |
+------------------+        +---------------------+        +------------------+
                               |            |
                               v            v
                       +-----------------------+
                       |    Message Queue      |
                       +-----------------------+
```

この三段階を踏むことで、開発初期の PoC から大規模運用までスムーズに移行できます。

## Hub の実行方法

### 開発環境

```
pnpm ts-node src/infrastructure/ws-hub/index.ts
```

環境変数 `HUB_JWT_SECRET` などを `.env.local` に設定した上で実行します。WebSocket は `NEXT_PUBLIC_HUB_WS_URL` で指定した URL で待ち受けます。

### 本番環境

1. `tsc` でビルド

   ```bash
   pnpm exec tsc src/infrastructure/ws-hub/index.ts --outDir dist
   ```

2. Node.js で起動

   ```bash
   NODE_ENV=production node dist/index.js
   ```

Redis と Kafka の接続先は `REDIS_URL`、`KAFKA_BROKER_URL` で指定できます。
