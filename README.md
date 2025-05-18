# DeepTrader

![DeepTrader Logo](./public/logo.png)

## 概要

DeepTraderは自然言語を活用した次世代の暗号資産トレーディングアシスタントです。AI技術を駆使して、トレーダーの意思決定をサポートし、市場分析から注文執行までをシームレスに支援します。

### 主な特徴

- **自然言語インターフェース**: チャットGPTライクなUIで直感的なトレーディング体験
- **AIアシスタント**: Mastra AIエージェントによる高度な市場分析と取引支援
- **リアルタイムチャート**: LightWeight Chartsによる高性能チャート表示とリアルタイム価格
  更新、移動平均線やRSIなどのテクニカル指標を表示
- **マルチチャネル分析**: テクニカル分析、センチメント分析、ニュース分析を統合
- **自動トレード実行**: 承認プロセスを経て取引を自動実行
- **取引所連携**: BitGet APIを初期サポート（今後拡大予定）

## 技術スタック

- **フロントエンド**: Next.js, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL)
- **AI/ML**: Mastra AIエージェント, OpenAI API
- **チャート**: LightWeight Charts
- **取引所API**: BitGet (初期フェーズ)
- **開発手法**: TDD（テスト駆動開発）, DDD（ドメイン駆動設計）

## 始め方

### 必要条件

- Node.js 18.x以上
- npm または yarn
- Supabase アカウント
- 各種API キー (OpenAI, BitGet)

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/rakansens/Deeptrader.git
cd Deeptrader

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# `.env.local` に Supabase の接続情報と各種 API キーを設定

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスできます。

## ドキュメント

詳細なドキュメントは以下のディレクトリに格納されています：

- [要件定義](./docs/requirements/README.md)
- [アーキテクチャ設計](./docs/architecture/README.md)
- [Mastra AIエージェント](./docs/mastra/README.md)
- [開発ガイドライン](./docs/development/README.md)
- [Supabase セットアップ](./docs/supabase/README.md)

## ライセンス

Copyright © 2023 DeepTrader Team. All rights reserved. 