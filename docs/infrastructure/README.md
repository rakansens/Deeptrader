# オンチェーンデータプロバイダー

DeepTrader ではウォレット残高やトランザクション情報の取得に [Blockchair](https://blockchair.com/api/docs) API を利用します。`src/infrastructure/blockchain-service.ts` がこの API との通信を担当します。

## 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、以下の値を設定してください。

```bash
cp .env.example .env.local
```

```dotenv
BLOCKCHAIR_API_KEY=your-api-key
BLOCKCHAIR_BASE_URL=https://api.blockchair.com/ethereum
```

`BLOCKCHAIR_API_KEY` は Blockchair で発行される API キーです。`BLOCKCHAIR_BASE_URL` は必要に応じて変更可能です。

## 仕組み

`getAddressInfo(address)` メソッドで指定アドレスの残高とトランザクション数を取得し、`onChainDataTool` から利用します。テストではこのサービスをモックして動作を検証します。
