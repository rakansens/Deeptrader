// tests/integration/test-chat-responses.mjs
// チャットAPIの応答内容検証テスト

const BASE_URL = 'http://localhost:3002'; // 開発サーバーのポート

// チャット応答テストケース
const chatTestCases = [
  {
    name: 'UI操作要求 - ETH切り替え',
    payload: {
      message: 'ETHに切り替えて',
      symbol: 'BTCUSDT',
      timeframe: '1h'
    },
    expectedAgent: 'ui',
    expectedOperations: ['change_symbol'],
    expectedContent: ['ETH', 'ETHUSDT', '切り替え', '変更']
  },
  {
    name: 'UI操作要求 - 複合操作',
    payload: {
      message: 'ダークテーマにしてBTCの4時間足を表示',
      symbol: 'ETHUSDT',
      timeframe: '1h'
    },
    expectedAgent: 'ui',
    expectedOperations: ['change_theme', 'change_symbol', 'change_timeframe'],
    expectedContent: ['ダーク', 'BTC', '4時間', '実行完了']
  },
  {
    name: 'トレーディング分析要求',
    payload: {
      message: '現在のBTCチャートを分析してトレンドを教えて',
      symbol: 'BTCUSDT',
      timeframe: '1h'
    },
    expectedAgent: 'trading',
    expectedContent: ['分析', 'トレーディング', 'BTC', 'チャート']
  },
  {
    name: '市場リサーチ要求',
    payload: {
      message: '今日の暗号通貨ニュースを教えて',
      symbol: 'BTCUSDT',
      timeframe: '1h'
    },
    expectedAgent: 'research',
    expectedContent: ['リサーチ', 'ニュース', '情報', '市場']
  },
  {
    name: '一般的な挨拶',
    payload: {
      message: 'こんにちは、調子はどうですか？',
      symbol: 'BTCUSDT',
      timeframe: '1h'
    },
    expectedAgent: 'general',
    expectedContent: ['こんにちは', '調子', 'どうですか']
  }
];

// 応答内容検証関数
function validateResponse(testCase, responseData) {
  const issues = [];
  
  // 基本的な成功チェック
  if (!responseData.success) {
    issues.push(`❌ API呼び出し失敗: ${responseData.error}`);
    return issues;
  }
  
  // 応答内容の存在チェック
  const responseText = responseData.response || responseData.execution?.response || '';
  if (!responseText) {
    issues.push('❌ 応答テキストが空です');
    return issues;
  }
  
  console.log(`📝 応答内容: "${responseText.substring(0, 200)}..."`);
  
  // エージェント委任先チェック
  if (testCase.expectedAgent && responseData.orchestrator?.targetAgent) {
    const actualAgent = responseData.orchestrator.targetAgent;
    if (actualAgent !== testCase.expectedAgent && actualAgent !== 'unified') {
      issues.push(`⚠️ 期待エージェント: ${testCase.expectedAgent}, 実際: ${actualAgent}`);
    } else {
      console.log(`✅ エージェント委任: ${actualAgent}`);
    }
  }
  
  // 期待コンテンツの存在チェック
  if (testCase.expectedContent) {
    const lowerResponse = responseText.toLowerCase();
    const missingContent = testCase.expectedContent.filter(content => 
      !lowerResponse.includes(content.toLowerCase())
    );
    
    if (missingContent.length > 0) {
      issues.push(`⚠️ 期待コンテンツ不足: ${missingContent.join(', ')}`);
    } else {
      console.log(`✅ 期待コンテンツ確認: ${testCase.expectedContent.join(', ')}`);
    }
  }
  
  // UI操作の実行チェック
  if (testCase.expectedOperations) {
    const executedOps = responseData.execution?.executedOperations || [];
    if (executedOps.length > 0) {
      console.log(`✅ UI操作実行: ${executedOps.map(op => op.description).join(', ')}`);
    } else {
      issues.push('⚠️ 期待されたUI操作が実行されていません');
    }
  }
  
  // MASTRA使用状況チェック
  if (responseData.orchestrator?.mastraUsed !== undefined) {
    console.log(`🤖 MASTRA使用: ${responseData.orchestrator.mastraUsed ? 'はい' : 'いいえ'}`);
  }
  
  // 実行モードチェック
  if (responseData.mode) {
    console.log(`🔧 実行モード: ${responseData.mode}`);
  }
  
  return issues;
}

// チャット応答テスト実行
async function runChatResponseTest(testCase) {
  console.log(`\n🗨️ チャットテスト: ${testCase.name}`);
  console.log(`💬 メッセージ: "${testCase.payload.message}"`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testCase.payload)
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      console.log(`❌ HTTPエラー: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    
    console.log(`⏱️ 応答時間: ${duration}ms`);
    
    // 応答内容を検証
    const issues = validateResponse(testCase, data);
    
    if (issues.length === 0) {
      console.log(`✅ 全ての検証をパス`);
      return true;
    } else {
      console.log(`⚠️ 検証で問題発見:`);
      issues.forEach(issue => console.log(`   ${issue}`));
      return false;
    }
    
  } catch (error) {
    console.log(`❌ 接続エラー: ${error.message}`);
    return false;
  }
}

// 全チャットテスト実行
async function runAllChatTests() {
  console.log('🗨️ チャットAPI応答内容検証テスト開始');
  console.log('='.repeat(60));
  
  let successCount = 0;
  let totalCount = chatTestCases.length;
  
  for (const testCase of chatTestCases) {
    const success = await runChatResponseTest(testCase);
    if (success) successCount++;
    
    // テスト間に間隔を空ける
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 チャットテスト結果: ${successCount}/${totalCount} 成功`);
  
  if (successCount === totalCount) {
    console.log('🎉 全てのチャット応答が適切です！');
  } else {
    console.log('⚠️ 一部のチャット応答に改善の余地があります。');
  }
  
  return successCount === totalCount;
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllChatTests()
    .then(allPassed => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ チャットテスト実行エラー:', error);
      process.exit(1);
    });
} 