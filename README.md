# DeepTrader

## 概要

DeepTraderは自然言語を活用した次世代の暗号資産トレーディングアシスタントです。AI技術を駆使して、トレーダーの意思決定をサポートし、市場分析から注文執行までをシームレスに支援します。

### 主な特徴

- **自然言語インターフェース**: チャットGPTライクなUIで直感的なトレーディング体験
- **AIアシスタント**: Mastra AIエージェントによる高度な市場分析と取引支援
- **リアルタイムチャート**: LightWeight Chartsによる高性能チャート表示とリアルタイム価格更新
  移動平均線やボリンジャーバンドをチャート上に重ね、RSI/MACDは専用パネルとして表示可能
  ChartToolbarからこれらのインジケーターをワンクリックで切り替え
  さらに、チャート上に手書きメモを残せるDrawingCanvasオーバーレイを搭載
  チャートを画像化してチャットへ送信できるスクリーンショットボタンを搭載
- **ライブオーダーブック**: Binanceの注文板をリアルタイム表示
- **マルチチャネル分析**: テクニカル分析、センチメント分析、ニュース分析を統合
- **自動トレード実行**: 承認プロセスを経て取引を自動実行
- **取引所連携**: Binance APIを中心にサポート（今後拡大予定）

## 技術スタック

- **フロントエンド**: Next.js, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL)
- **AI/ML**: Mastra AIエージェント, OpenAI API
- **チャート**: LightWeight Charts
- **取引所API**: Binance (メイン)
- **開発手法**: TDD（テスト駆動開発）, DDD（ドメイン駆動設計）

## 始め方

### 必要条件

- Node.js 18.x以上
- pnpm 8.x以上
- Supabase アカウント
- 各種API キー (OpenAI, Binance)

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/rakansens/Deeptrader.git
cd Deeptrader

# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env.local
# `.env.local` に Supabase の接続情報と各種 API キーを設定
# Supabase CLI を使う場合は `SUPABASE_ACCESS_TOKEN` も追加してください
# `supabase/config.toml` の `project_id` 等も実際の値に書き換えます

### AIモデル設定

OpenAI Chat API で利用するモデルは環境変数 `AI_MODEL` で指定できます。
`.env.local` に値を設定しない場合、デフォルトで `gpt-4o` が使用されます。

# 開発サーバーの起動
pnpm dev
```

### useBinanceSocketのPING設定

`useBinanceSocket` ではデフォルトで PING メッセージを送信しません。接続維持のために
PING を定期送信する場合は、`pingInterval` オプションにミリ秒単位の値を指定してくだ
さい。

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスできます。

チャット画面では送信ボタン左のカメラアイコンから、表示中のチャートを画像として送信できます。キャプチャ時には `ChartDataContext` に保持された銘柄・時間枠・インジケーター値が自動的に付加され、以下のようなプロンプトと共にAIへ送られます。

```text
このチャートを分析してください。
symbol: BTC/USDT
timeframe: 1h
MA(50)=65000, MA(200)=64000
RSI=56.8
MACD=0.0012 (signal 0.0008, hist 0.0004)
```

## ドキュメント

詳細なドキュメントは以下のディレクトリに格納されています：

- [要件定義](./docs/requirements/README.md)
- [アーキテクチャ設計](./docs/architecture/README.md)
- [Mastra AIエージェント](./docs/mastra/README.md)
- [開発ガイドライン](./docs/development/README.md)
- [Supabase セットアップ](./docs/supabase/README.md)
- [WebSocket スケーリング戦略](./docs/infrastructure/websocket-scaling.md)

## ライセンス

本プロジェクトは [LICENSE](./LICENSE) ファイルの内容に基づき提供されています。
Copyright © 2023 DeepTrader Team. All rights reserved.
