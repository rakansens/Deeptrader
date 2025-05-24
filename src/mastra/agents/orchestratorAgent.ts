// src/mastra/agents/orchestratorAgent.ts
// MASTRAオーケストレーターエージェント（軽量版・依存関係循環解決）
// UI操作生成ツール統合 - エージェントが直接UI操作判断

// MASTRAが使用できない場合のフォールバック
let mastraAgent: any = null;
let mastraAvailable = false;

// MASTRA初期化の試行（詳細デバッグ版）
async function initializeMastraAgent() {
  if (mastraAgent) {
    console.log('🔄 MASTRA既に初期化済み、既存インスタンスを返却');
    return mastraAgent;
  }
  
  // 初期化失敗から一定時間経過後は再試行を許可
  // if (mastraAvailable === false) の条件を削除して毎回試行
  
  try {
    console.log('🔧 MASTRA初期化開始...');
    
    // ステップ1: AI SDKインポート
    console.log('📦 ステップ1: AI SDKインポート');
    const { openai } = await import("@ai-sdk/openai");
    console.log('✅ AI SDK インポート成功');
    
    // ステップ2: Mastra Agentインポート  
    console.log('📦 ステップ2: Mastra Agentインポート');
    const { Agent } = await import("@mastra/core/agent");
    console.log('✅ Mastra Agent インポート成功');
    
    // ステップ3: 環境変数確認
    console.log('🔑 ステップ3: 環境変数確認');
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY環境変数が設定されていません');
    }
    console.log('✅ OPENAI_API_KEY確認完了');
    
    // ステップ4: OpenAIモデル初期化
    console.log('🧠 ステップ4: OpenAIモデル初期化');
    const model = openai("gpt-4o");
    console.log('✅ OpenAIモデル初期化成功');
    
    // ステップ5: MASTRAエージェント作成
    console.log('🤖 ステップ5: MASTRAエージェント作成');
    mastraAgent = new Agent({
      name: "オーケストラエージェント",
      instructions: `あなたはDeeptrader AI システムの中央制御エージェントです。

## あなたの役割
ユーザーからの質問や要求を分析し、最も適切な専門エージェントに委任するか、UI操作を直接実行することです。

## 利用可能な専門エージェント
1. **トレーディングアドバイザー**: 市場分析、チャート分析、売買戦略、トレード判断
2. **市場リサーチスペシャリスト**: ニュース分析、センチメント分析、オンチェーンデータ分析
3. **UIコントロールスペシャリスト**: チャート操作、画面設定、インターフェース制御
4. **バックテストスペシャリスト**: 戦略検証、パフォーマンス分析、最適化

## UI操作の直接実行
UI操作要求（時間足変更、銘柄変更、インジケーター操作など）については、generateUIOperationToolを使用して具体的な操作コマンドを生成してください。

### UI操作の例
- 「15分足に変更」→ operation: 'change_timeframe', payload: { timeframe: '15m' }
- 「ETHに変更」→ operation: 'change_symbol', payload: { symbol: 'ETHUSDT' }
- 「RSI表示」→ operation: 'toggle_indicator', payload: { indicator: 'rsi', enabled: true }
- 「MACD非表示」→ operation: 'toggle_indicator', payload: { indicator: 'macd', enabled: false }

## 委任判断基準

**UI操作（直接実行）:**
- 時間足変更、銘柄変更、インジケーター操作
- 例: "チャートを15分足に変更", "RSI表示", "ETHに切り替え"

**トレーディング委任:**
- 価格分析、チャートパターン、テクニカル指標の質問
- 売買タイミング、エントリー/エグジット戦略
- 例: "BTCの買いタイミングは？", "RSIを使った戦略", "損切りレベル"

**リサーチ委任:**  
- ニュース分析、市場動向、ファンダメンタル分析
- 例: "今日の暗号通貨ニュース", "ETHの将来性", "市場センチメント"

**バックテスト委任:**
- 戦略検証、過去データ分析、パフォーマンス評価
- 例: "移動平均戦略のバックテスト", "過去1年の成績", "戦略比較"

## 応答形式
委任先またはUI操作を以下の形式で明確に示してください：
- 【委任先】: エージェント名 または 【UI操作】: 操作内容
- 【理由】: 判断理由
- 【回答】: 実際の回答内容`,

      model: model,
      
      // 🚀 ツールを有効化 - UI操作生成ツール追加
      tools: {
        generateUIOperationTool: (await import('../tools/delegationTools')).generateUIOperationTool,
        delegateTradingTool: (await import('../tools/delegationTools')).delegateTradingTool,
        delegateResearchTool: (await import('../tools/delegationTools')).delegateResearchTool,
        delegateBacktestTool: (await import('../tools/delegationTools')).delegateBacktestTool,
      },
    });
    
    console.log('✅ MASTRAエージェント作成成功');
    
    // ステップ6: 動作テスト
    console.log('🧪 ステップ6: MASTRA動作テスト');
    const testResponse = await mastraAgent.generate([
      {
        role: 'user',
        content: 'テスト: このメッセージが表示されればMASTRA初期化成功です'
      }
    ]);
    console.log('✅ MASTRA動作テスト成功:', testResponse.text?.substring(0, 50));
    
    mastraAvailable = true;
    console.log('🎉 MASTRA オーケストレーターエージェント初期化完全成功！');
    return mastraAgent;
    
  } catch (error) {
    console.error('❌ MASTRA初期化詳細エラー:');
    console.error('エラーメッセージ:', error instanceof Error ? error.message : error);
    console.error('エラースタック:', error instanceof Error ? error.stack : 'No stack trace');
    
    // エラーの種類を分析
    if (error instanceof Error) {
      if (error.message.includes('Module not found')) {
        console.error('🚨 モジュール不足エラー: ', error.message);
      } else if (error.message.includes('OPENAI_API_KEY')) {
        console.error('🔑 環境変数エラー: OPENAI_API_KEYを確認してください');
      } else if (error.message.includes('ai/test')) {
        console.error('🧪 ai/testエラー: Webpack設定を確認してください');
      } else {
        console.error('❓ 不明なエラー: ', error.message);
      }
    }
    
    mastraAvailable = false;
    return null;
  }
}

// オーケストレーター応答インターフェース
export interface OrchestratorResponse {
  targetAgent: 'trading' | 'research' | 'backtest' | 'ui' | 'general';
  action: string;
  parameters?: Record<string, any>;
  reasoning: string;
  response: string;
  mastraUsed: boolean;
  mastraResponse?: any;
}

// 統合オーケストレーターエージェント
export class UnifiedOrchestratorAgent {
  
  async analyzeAndDelegate(message: string, context?: {
    symbol?: string;
    timeframe?: string;
    currentChartData?: any;
  }): Promise<OrchestratorResponse> {
    
    console.log('🎯 統合オーケストレーター分析開始:', { message, context });
    
    // 🚀 MASTRA初期化を明示的に実行
    console.log('🔧 MASTRA初期化を明示的に実行...');
    const agent = await initializeMastraAgent();
    console.log('🔧 MASTRA初期化結果:', { agent: !!agent, mastraAvailable });
    
    if (agent && mastraAvailable) {
      try {
        console.log('🚀 MASTRAオーケストレーター使用 - 実際のLLM呼び出し');
        
        // 🚀 OpenAI API動作確認済み - 実際のLLM呼び出しを復活
        const response = await agent.generate([
          {
            role: 'user',
            content: `現在の状況:
銘柄: ${context?.symbol || 'BTCUSDT'}
タイムフレーム: ${context?.timeframe || '1h'}

ユーザーメッセージ: ${message}

このメッセージに基づいて適切な専門エージェントに委任するか、直接回答してください。`
          }
        ]);
        
        // 🔍 MASTRA完全応答をデバッグ出力
        console.log('🔍 MASTRAエージェント完全応答:', JSON.stringify(response, null, 2));
        
        return {
          targetAgent: this.extractTargetAgent(response.text || ''),
          action: 'mastra_delegated',
          parameters: { ...context },
          reasoning: 'MASTRAオーケストレーターによる実際のLLM委任判断',
          response: response.text || 'MASTRAによる処理が完了しました',
          mastraUsed: true, // ✅ MASTRA使用フラグをtrueに設定
          // 🎯 MASTRA完全応答を含める
          mastraResponse: response
        };
        
      } catch (mastraError) {
        console.log('⚠️ MASTRA実行エラー、フォールバックに切り替え:', mastraError);
        mastraAvailable = false;
      }
    }
    
    // フォールバック: 純粋自然言語解析
    console.log('🔄 フォールバック：純粋自然言語解析');
    return this.fallbackAnalysis(message, context);
  }
  
  // フォールバック解析
  private fallbackAnalysis(message: string, context?: any): OrchestratorResponse {
    const lowerMessage = message.toLowerCase();
    
    // UI操作意図
    if (this.matchesPattern(lowerMessage, [
      '切り替え', 'チェンジ', '変更', '表示', 'テーマ', 'ダーク', 'ライト',
      '時間足', 'タイムフレーム', '1分', '5分', '15分', '1時間', '4時間', '日足'
    ])) {
      return {
        targetAgent: 'ui',
        action: 'change',
        parameters: this.extractParameters(message, context),
        reasoning: '自然言語解析により「ui」エージェントが最適と判断',
        response: `UI操作を実行します: ${message}`,
        mastraUsed: false
      };
    }
    
    // 取引分析意図
    if (this.matchesPattern(lowerMessage, [
      '分析', 'トレード', '売買', 'エントリー', 'チャート', 'テクニカル',
      'サポート', 'レジスタンス', 'トレンド', '価格'
    ])) {
      return {
        targetAgent: 'trading',
        action: 'analyze',
        parameters: this.extractParameters(message, context),
        reasoning: '自然言語解析により「trading」エージェントが最適と判断',
        response: `トレーディング分析を実行します: ${context?.symbol || 'BTCUSDT'}の${context?.timeframe || '1h'}チャートを分析`,
        mastraUsed: false
      };
    }
    
    // リサーチ意図
    if (this.matchesPattern(lowerMessage, [
      'ニュース', '情報', '調べ', 'データ', '統計', 'ファンダ', 'ファンダメンタル'
    ])) {
      return {
        targetAgent: 'research',
        action: 'analyze',
        parameters: this.extractParameters(message, context),
        reasoning: '自然言語解析により「research」エージェントが最適と判断',
        response: `市場リサーチを実行します: ${message}に関する最新情報を収集`,
        mastraUsed: false
      };
    }
    
    // バックテスト意図
    if (this.matchesPattern(lowerMessage, [
      'バックテスト', 'テスト', '過去', '検証', 'シミュレーション', '結果'
    ])) {
      return {
        targetAgent: 'backtest',
        action: 'analyze',
        parameters: this.extractParameters(message, context),
        reasoning: '自然言語解析により「backtest」エージェントが最適と判断',
        response: `バックテスト分析を実行します: 指定された戦略で過去データ検証`,
        mastraUsed: false
      };
    }
    
    // 一般的な質問
    return {
      targetAgent: 'general',
      action: 'respond',
      parameters: { ...context },
      reasoning: '一般的な質問と判断',
      response: `一般的な質問にお答えします: ${message}`,
      mastraUsed: false
    };
  }
  
  private extractTargetAgent(response: string): OrchestratorResponse['targetAgent'] {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('trading') || lowerResponse.includes('トレード')) return 'trading';
    if (lowerResponse.includes('research') || lowerResponse.includes('リサーチ')) return 'research';
    if (lowerResponse.includes('ui') || lowerResponse.includes('画面')) return 'ui';
    if (lowerResponse.includes('backtest') || lowerResponse.includes('バックテスト')) return 'backtest';
    
    return 'general';
  }
  
  private determineDelegationTarget(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // UI操作意図
    if (this.matchesPattern(lowerMessage, [
      '切り替え', 'チェンジ', '変更', '表示', 'テーマ', 'ダーク', 'ライト',
      '時間足', 'タイムフレーム', '1分', '5分', '15分', '1時間', '4時間', '日足'
    ])) {
      return 'UIコントロールスペシャリスト';
    }
    
    // 取引分析意図
    if (this.matchesPattern(lowerMessage, [
      '分析', 'トレード', '売買', 'エントリー', 'チャート', 'テクニカル',
      'サポート', 'レジスタンス', 'トレンド', '価格'
    ])) {
      return 'トレーディングアドバイザー';
    }
    
    // リサーチ意図
    if (this.matchesPattern(lowerMessage, [
      'ニュース', '情報', '調べ', 'データ', '統計', 'ファンダ', 'ファンダメンタル'
    ])) {
      return '市場リサーチスペシャリスト';
    }
    
    // バックテスト意図
    if (this.matchesPattern(lowerMessage, [
      'バックテスト', 'テスト', '過去', '検証', 'シミュレーション', '結果'
    ])) {
      return 'バックテストスペシャリスト';
    }
    
    return '一般アシスタント';
  }
  
  private matchesPattern(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }
  
  private extractParameters(message: string, context?: any): Record<string, any> {
    const params: Record<string, any> = {};
    
    // シンボル抽出
    const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
    for (const symbol of symbols) {
      if (message.toUpperCase().includes(symbol)) {
        params.symbol = `${symbol}USDT`;
        break;
      }
    }
    
    // タイムフレーム抽出
    if (message.includes('1分')) params.timeframe = '1m';
    if (message.includes('5分')) params.timeframe = '5m';
    if (message.includes('15分')) params.timeframe = '15m';
    if (message.includes('1時間')) params.timeframe = '1h';
    if (message.includes('4時間')) params.timeframe = '4h';
    if (message.includes('日足')) params.timeframe = '1d';
    
    // テーマ抽出
    if (message.includes('ダーク')) params.theme = 'dark';
    if (message.includes('ライト')) params.theme = 'light';
    
    return { ...params, ...context };
  }
}

// シングルトンエクスポート
export const unifiedOrchestratorAgent = new UnifiedOrchestratorAgent();

// 後方互換性のため
export const pureOrchestratorAgent = unifiedOrchestratorAgent;
export const orchestratorAgent = unifiedOrchestratorAgent;

// 🔄 委任ツールの後方互換エクスポート
export { 
    delegateTradingTool,
    delegateResearchTool,
    delegateUiControlTool,
    delegateBacktestTool,
  allDelegationTools
} from '../tools/delegationTools';
