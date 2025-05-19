# CodeX 開発エージェントの指示ルール

## 概要

このファイルはCodeX開発エージェントに対する指示ルールを定義します。DeepTraderプロジェクトの開発において、エージェントがコードを生成・修正する際の方針を示します。

## プロジェクト情報

- **プロジェクト名**: DeepTrader
- **概要**: 自然言語インターフェースを使った暗号資産トレーディングアシスタント
- **主要技術**: Next.js, Supabase, Mastra AIエージェント, LightWeight Charts
- **開発方針**: ドメイン駆動設計(DDD), テスト駆動開発(TDD)
- **パッケージマネージャー**: pnpm (v8.15.1以上)

## コーディングスタイル

### 基本方針

- **言語**: TypeScript (Next.js) 
- **スタイル**: [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)に準拠
- **型付け**: 厳格な型付けを使用し、`any`型の使用を避ける
- **コンポーネント**: 関数コンポーネントとReact Hooksを使用する
- **フォーマット**: Prettierのデフォルト設定に従う

### 命名規則

- **ファイル名**: ケバブケース (例: `trading-chart.tsx`)
- **コンポーネント名**: パスカルケース (例: `TradingChart`)
- **変数/関数名**: キャメルケース (例: `getMarketData`)
- **定数**: 大文字のスネークケース (例: `MAX_RETRY_COUNT`)
- **インターフェース**: 接頭辞 `I` なし (例: `User` ではなく `IUser`ではない)
- **型エイリアス**: パスカルケース (例: `TradeAction`)

## ディレクトリ構造

- コードはすべて `src/` ディレクトリ内に配置
- Next.js App Routerの構造に従う
- ドメイン駆動設計の原則に基づいてコードを構造化

```
/src
  /app                      # Next.js App Router
  /components               # UIコンポーネント
  /hooks                    # カスタムフック
  /lib                      # ユーティリティ関数
  /mastra                   # Mastra AIエージェント
    /agents                 # エージェント定義
    /tools                  # ツール定義
    /workflows              # ワークフロー
    /memory                 # メモリ管理
    /mcp                    # MCPサーバー/クライアント
  /domain                   # ドメインロジック
    /trading                # トレーディングドメイン
    /market                 # 市場データドメイン
    /user                   # ユーザードメイン
  /infrastructure           # 外部サービス連携
  /types                    # 型定義
  /tests                    # テストファイル
```

## テスト方針

- Jestをテストフレームワークとして使用
- すべての新機能に対してテストを作成
- テストファイルは対応するコードと同じディレクトリ構造に配置
- 命名規則:
  - ユニットテスト: `*.test.ts(x)`
  - 統合テスト: `*.integration.test.ts(x)`
  - E2Eテスト: `*.e2e.test.ts(x)`

## コード生成ルール

### 一般ルール

1. **簡潔さ**: 不必要な複雑さを避ける
2. **読みやすさ**: 自己説明的なコードを書く
3. **再利用性**: コードの重複を避ける
4. **安全性**: エラーハンドリングを適切に実装する
5. **パフォーマンス**: 効率的なコードを書く
6. **セキュリティ**: セキュリティの脆弱性を避ける

### コメント

- コードに関するコメントは日本語で記述
- 複雑なロジックや非自明な決定には説明コメントを追加
- JSDocスタイルのコメントを関数やクラスに使用

```typescript
/**
 * チャートデータを取得する
 * @param symbol - 取得する通貨ペア（例："BTC/USDT"）
 * @param timeframe - 時間枠（例："1h"）
 * @returns チャートデータの配列
 */
```

### エラー処理

- 適切な場所で try-catch ブロックを使用
- エラーは具体的で、ユーザーが理解できるメッセージにする
- APIリクエストにはタイムアウト処理を追加

### 状態管理

- React コンポーネントでは、適切な状態管理を使用（useState, useReducer, useContext）
- グローバル状態には context APIを使用
- メモ化（useMemo, useCallback）を適切に使用してパフォーマンスを最適化

## API・サービス連携

### Supabase

- Supabase クライアントは一箇所で初期化し、必要な場所でインポート
- クエリはタイプセーフに書く
- RLSを適切に設定してセキュリティを確保

### Mastra AI

- エージェントの定義はシンプルかつ明確に
- エージェント間の連携を考慮
- ツールの再利用と拡張性を考慮した設計

### 外部APIリクエスト

- API キーは環境変数で管理
- レート制限を考慮した実装
- レスポンスをキャッシュして不要なリクエストを減らす

## デプロイメント考慮事項

- 環境変数を適切に設定
- ビルド時の最適化（バンドルサイズの最小化、コード分割など）
- Vercel へのデプロイに適した設定

## コード生成の例

### UIコンポーネント例

```tsx
// src/components/TradingChart.tsx
import { useState, useEffect } from 'react';
import { createChart } from 'lightweight-charts';
import { useMarketData } from '@/hooks/useMarketData';
import type { ChartConfig, MarketData } from '@/types';

interface TradingChartProps {
  symbol: string;
  timeframe: string;
  height?: number;
  width?: number;
}

export function TradingChart({ 
  symbol, 
  timeframe, 
  height = 400, 
  width = 600 
}: TradingChartProps) {
  const [chartContainer, setChartContainer] = useState<HTMLDivElement | null>(null);
  const { data, isLoading, error } = useMarketData(symbol, timeframe);
  
  useEffect(() => {
    if (!chartContainer || !data) return;
    
    const chart = createChart(chartContainer, {
      height,
      width,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    // チャートの設定と描画処理
    // ...
    
    return () => {
      chart.remove();
    };
  }, [chartContainer, data, height, width]);
  
  if (isLoading) return <div>データを読み込み中...</div>;
  if (error) return <div>エラーが発生しました: {error.message}</div>;
  
  return <div data-testid="trading-chart" ref={setChartContainer} />;
}
```

### テスト例

```tsx
// src/components/TradingChart.test.tsx
import { render, screen } from '@testing-library/react';
import { TradingChart } from './TradingChart';
import { useMarketData } from '@/hooks/useMarketData';

// モックの設定
jest.mock('@/hooks/useMarketData');
const mockUseMarketData = useMarketData as jest.MockedFunction<typeof useMarketData>;

describe('TradingChart', () => {
  it('ローディング状態が正しく表示されること', () => {
    mockUseMarketData.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    
    render(<TradingChart symbol="BTC/USDT" timeframe="1h" />);
    expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
  });
  
  // 他のテストケース
});
```

## その他の指示

- アプリケーションの性能を考慮したコード生成
- モバイルレスポンシブなUIデザイン
- アクセシビリティ配慮
- 国際化対応（i18n）の考慮
- Lighthouseスコア改善を意識した実装

## コミュニケーション

- 提案内容には常に根拠や考慮した代替案を含める
- 生成したコードには簡潔な説明を添える
- 不明点や追加情報が必要な場合は質問する
- ベストプラクティスに基づく改善提案を積極的に行う

以上の規則に従って、DeepTraderプロジェクトの開発を支援してください。
