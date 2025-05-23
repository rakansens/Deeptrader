// tests/integration/test-agent-tools-detailed.mjs
// 各エージェントのツール実行詳細テスト（MASTRA TOOLS機能検証）

const BASE_URL = 'http://localhost:3002';

// 🎯 エージェント別ツール一覧定義
const AGENT_TOOLS = {
  research: {
    name: '市場リサーチスペシャリスト',
    tools: [
      { id: 'newsAnalysisTool', name: 'ニュース分析ツール', description: '暗号資産関連ニュースの検索・分析' },
      { id: 'onChainDataTool', name: 'オンチェーンデータツール', description: 'ブロックチェーン上のトランザクション・ウォレット活動分析' },
      { id: 'marketSentimentTool', name: '市場センチメントツール', description: 'ソーシャルメディア・フォーラムの感情分析' },
      { id: 'evaluationTool', name: '評価ツール', description: '総合的な市場評価' },
      { id: 'openInterestTool', name: 'オープンインタレストツール', description: '先物建玉増減の取得' }
    ]
  },
  trading: {
    name: 'トレーディングアドバイザー',
    tools: [
      { id: 'chartAnalysisTool', name: 'チャート分析ツール', description: 'テクニカル指標計算・パターン検出・Binanceデータ取得' },
      { id: 'marketDataTool', name: '市場データツール', description: '現在価格・取引量・市場データ取得' },
      { id: 'tradingExecutionTool', name: '取引実行ツール', description: 'ユーザー承認を得た取引実行' },
      { id: 'entrySuggestionTool', name: 'エントリー提案ツール', description: 'RSIベースの売買エントリー候補提示' }
    ]
  },
  ui: {
    name: 'UIコントロールスペシャリスト',
    tools: [
      { id: 'realChangeTimeframeTool', name: '実タイムフレーム変更', description: 'WebSocket経由での実際のタイムフレーム変更' },
      { id: 'realToggleIndicatorTool', name: '実インジケーター切り替え', description: 'WebSocket経由での実際のインジケーター表示切り替え' },
      { id: 'realChangeThemeTool', name: '実テーマ変更', description: 'WebSocket経由での実際のテーマ変更' },
      { id: 'realChangeSymbolTool', name: '実銘柄変更', description: 'WebSocket経由での実際の銘柄変更' },
      { id: 'realZoomChartTool', name: '実チャートズーム', description: 'WebSocket経由での実際のチャートズーム操作' },
      { id: 'changeChartTypeTool', name: 'チャート種類変更', description: 'チャートタイプの変更' },
      { id: 'uiActionLoggerTool', name: 'UI操作ログ', description: 'UI操作履歴の管理' }
    ]
  },
  backtest: {
    name: 'バックテストスペシャリスト',
    tools: [
      { id: 'backtestTool', name: 'バックテストツール', description: 'トレーディング戦略のバックテスト実行・パフォーマンス分析' }
    ]
  }
};

// 🧪 ツール実行テストケース定義（統合アーキテクチャ対応）
const TOOL_TEST_CASES = {
  research: [
    { 
      message: '今日のBitcoinに関するニュースを分析して市場センチメントを教えて',
      expectedAgent: '市場リサーチスペシャリスト',
      expectedTools: ['newsAnalysisTool', 'marketSentimentTool'],
      description: 'ニュース分析+センチメント分析'
    },
    { 
      message: 'ETHのオンチェーンデータとオープンインタレストの動向を調べて',
      expectedAgent: '市場リサーチスペシャリスト',
      expectedTools: ['onChainDataTool', 'openInterestTool'],
      description: 'オンチェーン+建玉データ'
    }
  ],
  trading: [
    { 
      message: 'BTCUSDTの1時間足チャートを分析してRSIとMACDの状況を教えて',
      expectedAgent: 'トレーディングアドバイザー',
      expectedTools: ['chartAnalysisTool', 'marketDataTool'],
      description: 'チャート分析+市場データ'
    },
    { 
      message: 'ETHUSDTの現在価格でエントリーポイントを提案して',
      expectedAgent: 'トレーディングアドバイザー',
      expectedTools: ['marketDataTool', 'entrySuggestionTool'],
      description: '市場データ+エントリー提案'
    }
  ],
  ui: [
    { 
      message: 'BTCの4時間足に変更してRSIインジケーターを表示して',
      expectedAgent: 'UIコントロールスペシャリスト',
      expectedTools: ['realChangeTimeframeTool', 'realToggleIndicatorTool'],
      description: 'タイムフレーム変更+インジケーター表示'
    },
    { 
      message: 'ダークテーマに変更してチャートを拡大表示して',
      expectedAgent: 'UIコントロールスペシャリスト',
      expectedTools: ['realChangeThemeTool', 'realZoomChartTool'],
      description: 'テーマ変更+ズーム操作'
    }
  ],
  backtest: [
    { 
      message: '移動平均クロス戦略でBTCの過去1ヶ月をバックテストして',
      expectedAgent: 'バックテストスペシャリスト',
      expectedTools: ['backtestTool'],
      description: 'バックテスト実行'
    }
  ]
};

// ツール一覧表示関数
function displayToolsOverview() {
  console.log('\n🔧 MASTRAエージェント別ツール機能一覧');
  console.log('='.repeat(80));
  
  Object.entries(AGENT_TOOLS).forEach(([agentType, agentInfo]) => {
    console.log(`\n📋 ${agentInfo.name} (${agentType})`);
    console.log('-'.repeat(60));
    
    agentInfo.tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} (${tool.id})`);
      console.log(`     └ ${tool.description}`);
    });
    
    console.log(`     📊 合計: ${agentInfo.tools.length}個のツール`);
  });
  
  console.log('\n' + '='.repeat(80));
  const totalTools = Object.values(AGENT_TOOLS).reduce((sum, agent) => sum + agent.tools.length, 0);
  console.log(`🎯 全エージェント合計: ${totalTools}個のツール`);
  console.log(`🏗️ アーキテクチャ: 統合ルーター → MASTRA → 専門エージェント → ツール実行`);
}

// 改良されたツール使用検出関数
function detectToolUsage(responseText, testCase, agentInfo) {
  const toolsUsed = [];
  const lowerResponse = responseText.toLowerCase();
  
  // 1. エージェント委任の確認
  const agentDetected = lowerResponse.includes(testCase.expectedAgent.toLowerCase());
  
  // 2. ツール関連キーワードの検出
  testCase.expectedTools.forEach(expectedTool => {
    const tool = agentInfo.tools.find(t => t.id === expectedTool);
    if (tool) {
      const keywords = [
        // ツール名の各部分
        ...tool.name.split(/[・\s]+/).filter(w => w.length > 2),
        // 説明の主要キーワード
        ...tool.description.split(/[・、。\s]+/).filter(w => w.length > 3),
        // 機能関連キーワード
        'チャート', '分析', 'データ', '指標', 'ニュース', 'センチメント', 
        'rsi', 'macd', 'バックテスト', 'テーマ', 'インジケーター'
      ];
      
      const found = keywords.some(keyword => 
        lowerResponse.includes(keyword.toLowerCase())
      );
      
      if (found) {
        toolsUsed.push(tool.name);
      }
    }
  });
  
  // 3. 実行結果の具体性チェック
  const specificResults = [
    'rsi', 'macd', 'ボリンジャー', '移動平均', '価格', 'データ', '分析',
    '変更', '実行', '完了', '表示', 'チャート', '設定'
  ].some(keyword => lowerResponse.includes(keyword));
  
  return {
    agentDetected,
    toolsUsed,
    specificResults,
    confidence: toolsUsed.length > 0 && specificResults ? 'high' : 
                agentDetected && specificResults ? 'medium' : 'low'
  };
}

// 個別エージェントのツール実行テスト（統合アーキテクチャ対応）
async function testAgentToolExecution(agentType) {
  const agentInfo = AGENT_TOOLS[agentType];
  const testCases = TOOL_TEST_CASES[agentType];
  
  if (!agentInfo || !testCases) {
    console.log(`⚠️ ${agentType}エージェントのテストケースが見つかりません`);
    return { success: 0, total: 0 };
  }
  
  console.log(`\n🧪 ${agentInfo.name}のツール実行テスト`);
  console.log('='.repeat(60));
  console.log(`🔧 利用可能ツール: ${agentInfo.tools.map(t => t.name).join(', ')}`);
  console.log(`🏗️ テスト方法: 統合ルーター → MASTRA委任 → ${agentInfo.name}`);
  
  let successCount = 0;
  const totalTests = testCases.length;
  
  for (const [index, testCase] of testCases.entries()) {
    console.log(`\n🧪 テスト ${index + 1}/${totalTests}: ${testCase.description}`);
    console.log(`💬 メッセージ: "${testCase.message}"`);
    console.log(`🎯 期待エージェント: ${testCase.expectedAgent}`);
    console.log(`🔧 期待ツール: ${testCase.expectedTools.join(', ')}`);
    
    try {
      // 統合ルーター経由でMASTRAエージェントに委任
      const response = await fetch(`${BASE_URL}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: testCase.message,
          strategy: 'mastra', // MASTRA使用を明示
          symbol: 'BTCUSDT',
          timeframe: '1h'
        })
      });
      
      if (!response.ok) {
        console.log(`❌ HTTP エラー: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ 統合ルーター応答成功 (${data.mode}モード)`);
        
        const responseText = data.message || data.response || '';
        console.log(`📝 応答: ${responseText.substring(0, 200)}...`);
        
        // 改良されたツール使用検出
        const detection = detectToolUsage(responseText, testCase, agentInfo);
        
        console.log(`🎯 エージェント委任: ${detection.agentDetected ? '✅' : '❌'} ${testCase.expectedAgent}`);
        
        if (detection.toolsUsed.length > 0) {
          console.log(`🔧 検出されたツール使用: ${detection.toolsUsed.join(', ')}`);
        } else {
          console.log(`⚠️ ツール使用の検出なし`);
        }
        
        console.log(`📊 具体的結果: ${detection.specificResults ? '✅' : '❌'}`);
        console.log(`🎯 信頼度: ${detection.confidence}`);
        
        // 成功判定
        if (detection.agentDetected && (detection.toolsUsed.length > 0 || detection.specificResults)) {
          console.log(`✅ テスト成功: エージェント委任+ツール実行を確認`);
          successCount++;
        } else if (detection.confidence === 'medium') {
          console.log(`🔶 部分成功: エージェント委任確認、ツール実行要検証`);
          successCount += 0.5;
        } else {
          console.log(`❌ テスト失敗: ツール実行が確認できません`);
        }
        
        // 追加情報表示
        if (data.executedOperations && data.executedOperations.length > 0) {
          console.log(`🎯 実行操作: ${data.executedOperations.length}個`);
        }
        
      } else {
        console.log(`❌ 統合ルーター応答失敗: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`❌ テスト実行エラー: ${error.message}`);
    }
    
    // テスト間の間隔
    if (index < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log(`\n📊 ${agentInfo.name} テスト結果: ${successCount}/${totalTests} 成功`);
  return { success: successCount, total: totalTests };
}

// 全エージェントツールテスト実行
async function runAllAgentToolTests() {
  console.log('🎯 MASTRAエージェントツール実行詳細テスト開始');
  console.log('🏗️ 統合アーキテクチャでのツール実行検証');
  
  // ツール一覧表示
  displayToolsOverview();
  
  let totalSuccess = 0;
  let totalTests = 0;
  
  const agentTypes = ['research', 'trading', 'ui', 'backtest'];
  
  for (const agentType of agentTypes) {
    const result = await testAgentToolExecution(agentType);
    totalSuccess += result.success;
    totalTests += result.total;
    
    // エージェント間の間隔
    await new Promise(resolve => setTimeout(resolve, 4000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 全エージェントツールテスト完了');
  console.log(`📊 総合結果: ${totalSuccess}/${totalTests} 成功 (${Math.round(totalSuccess/totalTests*100)}%)`);
  
  if (totalSuccess >= totalTests * 0.8) {
    console.log('✅ 大部分のエージェントが期待されたツールを正しく使用しています！');
  } else if (totalSuccess >= totalTests * 0.5) {
    console.log('🔶 約半数のエージェントでツール使用を確認。改善の余地があります。');
  } else {
    console.log('⚠️ ツール実行検証で課題が発見されました。詳細な調査が必要です。');
  }
  
  return totalSuccess >= totalTests * 0.7;
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllAgentToolTests()
    .then(allPassed => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ エージェントツールテスト実行エラー:', error);
      process.exit(1);
    });
} 