# MASTRAメモリ機能 - 具体的使用例と効果

## 🎯 1. 個人化されたトレーディングサポート

### 従来（メモリなし）
```typescript
// 毎回同じ汎用的な分析
ユーザー: "BTCの分析をお願いします"
AI: "BTC/USDTを分析します。現在価格は$45,000です..."
```

### メモリ機能後
```typescript
// 個人の取引履歴と好みを考慮した分析
ユーザー: "BTCの分析をお願いします"
AI: "前回の$42,000でのエントリー（+3.2%成功）を参考に、
     あなたの好む4時間足で分析します。RSIが28と過売り圏で、
     あなたの得意な押し目買いパターンが出現しています。"
```

### 実装コード例
```typescript
// src/mastra/agents/tradingAgent.ts
const memory = new Memory({
  storage: new SupabaseVectorStorage({
    lastMessages: 40,
    semanticRecall: {
      topK: 5,        // 類似状況上位5件を取得
      messageRange: 2, // 前後2メッセージを含める
    },
  }),
});

export const tradingAgent = new Agent({
  name: "トレーディングアドバイザー",
  memory: memory, // 🔥 メモリ機能が有効
  tools: { chartAnalysisTool, marketDataTool },
  instructions: `
    過去の会話履歴を参考にして、ユーザーの取引スタイルに
    合わせた個別化されたアドバイスを提供してください。
  `
});
```

## 📚 2. 学習型分析の継続性

### シナリオ: 2週間連続のBTC分析

**1日目**: 
```
ユーザー: "BTCの状況はどうですか？"
AI: "$42,000のサポートレベルを確認。RSI30で過売り状態です。"
メモリ保存: [分析日時, 価格レベル, 指標状況, 推奨アクション]
```

**3日目**:
```
ユーザー: "前回の分析後、どう変化しましたか？"
AI: "2日前の$42,000サポート分析では上昇を予測しました。
     現在$43,500まで上昇（+3.6%）しています。
     予測が的中したため、利確タイミングを検討しましょう。"
```

**2週間後**:
```
ユーザー: "また分析をお願いします"
AI: "2週間前のサイクルを参考にします。
     前回：$42,000→$44,000（+4.8%成功）
     現在：$41,800（類似パターン）
     あなたの成功パターンが再現される可能性があります。"
```

### メモリ活用コード
```typescript
// 過去の類似状況を検索
const similarAnalysis = await storage.semanticSearch(
  queryEmbedding, 
  {
    topK: 3,
    threshold: 0.8,
    threadId: 'btc_analysis',
    resourceId: userId
  }
);

// 成功パターンを学習
const successfulTrades = messages.filter(msg => 
  msg.metadata?.result === 'successful' && 
  msg.metadata?.profitLoss > 0
);
```

## 🧵 3. 複数テーマ並行管理

### 実際の使用例
```typescript
const threads = {
  'btc_daily_analysis': '日次BTC分析スレッド',
  'eth_swing_trading': 'ETHスイングトレード戦略',
  'portfolio_review': 'ポートフォリオレビュー',
  'market_sentiment': '市場センチメント分析',
  'risk_management': 'リスク管理相談'
};

// 各スレッドで独立した文脈を保持
await storage.saveMessage({
  threadId: 'btc_daily_analysis',
  content: "BTC日次分析：サポート$42,000確認",
  metadata: { analysis_type: 'daily', symbol: 'BTCUSDT' }
});

await storage.saveMessage({
  threadId: 'eth_swing_trading', 
  content: "ETHスイング：1週間ホールド戦略実行中",
  metadata: { strategy: 'swing', timeframe: '1w' }
});
```

## 🎓 4. 学習型成功パターン認識

### 実装例
```typescript
class TradingPatternLearner {
  async analyzeSuccessPatterns(userId: string) {
    const successfulTrades = await storage.getMessages(
      undefined, userId, 100
    ).then(messages => 
      messages.filter(m => m.metadata?.result === 'successful')
    );

    const patterns = {
      priceRanges: this.extractPricePatterns(successfulTrades),
      indicators: this.extractIndicatorPatterns(successfulTrades),
      timeframes: this.extractTimeframePatterns(successfulTrades),
      entrySignals: this.extractEntrySignals(successfulTrades)
    };

    return {
      successRate: this.calculateSuccessRate(patterns),
      recommendations: this.generateRecommendations(patterns)
    };
  }

  generatePersonalizedAdvice(currentMarket: any, patterns: any) {
    return `
      あなたの成功パターン分析:
      • ${patterns.priceRanges.best}付近でのエントリー成功率: 78%
      • ${patterns.indicators.favorite}での勝率: 82%
      • 推奨アクション: ${this.matchPattern(currentMarket, patterns)}
    `;
  }
}
```

## 🔍 5. セマンティック検索の威力

### 自然言語による過去分析検索
```typescript
// ユーザーの質問
const query = "前回のような暴落時はどう対応しましたか？";

// 自動的に関連する過去の状況を検索
const relatedMemories = await semanticSearch(
  await embedQuery(query),
  { 
    topK: 5,
    threshold: 0.75 
  }
);

// 結果例:
// 1. "2024-01-10: BTC 15%暴落時→段階的買い下がり戦略→+8%成功"
// 2. "2024-01-15: ETH急落対応→ストップロス発動→-2%損切り成功"  
// 3. "2024-01-20: 市場全体暴落→現金比率50%→リスク回避成功"
```

## 🏆 6. 実際の成果例

### Before（メモリなし）
- 毎回同じ汎用分析
- 過去の成功・失敗を考慮できない
- ユーザーの好みを学習できない
- 戦略の一貫性なし

### After（メモリあり）
- 個人の取引履歴を考慮した分析
- 成功パターンの学習と活用
- ユーザースタイルに合わせた推奨
- 長期的な戦略の一貫性

### 具体的な改善数値（想定）
```
分析の個人化度: 0% → 85%
推奨の精度向上: +45%
ユーザー満足度: +60%
継続利用率: +70%
```

## 🚀 7. 今すぐ試せる活用方法

### Step 1: Supabaseスキーマ適用
```bash
# database/mastra-schema.sqlを実行
psql -h your-db-host -U postgres -d postgres -f database/mastra-schema.sql
```

### Step 2: エージェントでメモリ機能テスト
```bash
# メモリ付きエージェントでテスト
npm test -- src/tests/mastra/agents/tradingAgent.test.ts
```

### Step 3: チャットでメモリ効果実感
```bash
# UIでメモリ機能を体験
npm run dev
# http://localhost:3000 でチャット開始
# 同じ質問を繰り返して学習効果を確認
```

## 🎯 8. メモリ機能の究極目標

**「あなた専用のAIトレーディングパートナー」**

- あなたの取引スタイルを完全に理解
- 成功パターンを学習して再現
- 失敗を学習してリスク回避
- 長期的な資産成長をサポート

これで**単なるAIツール**から**学習型AIパートナー**に進化！

---

*MASTRAメモリ機能により、真の「AI学習型トレーディングアシスタント」が実現されました。* 