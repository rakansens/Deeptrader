// tests/api/test-agents-integration.mjs
// 新しい統合エージェントAPI構造の動作テスト

// Node.js 18+ ネイティブfetchを使用

const BASE_URL = 'http://localhost:3000';

// テストケース定義
const testCases = [
  {
    name: '統合エージェント - 自動選択（Pure フォールバック）',
    endpoint: '/api/agents',
    payload: {
      message: 'ETHに切り替えて',
      strategy: 'auto'
    }
  },
  {
    name: '統合エージェント - Pure 明示指定',
    endpoint: '/api/agents',
    payload: {
      message: 'BTCの4時間足に変更',
      strategy: 'pure'
    }
  },
  {
    name: '統合エージェント - MASTRA 明示指定',
    endpoint: '/api/agents',
    payload: {
      message: '今のチャートを分析して',
      strategy: 'mastra'
    }
  },
  {
    name: 'Pure エージェント直接',
    endpoint: '/api/agents/pure',
    payload: {
      message: 'ダークテーマに変更して'
    }
  },
  {
    name: 'MASTRA エージェント直接',
    endpoint: '/api/agents/mastra',
    payload: {
      message: 'SOLの価格分析をお願いします'
    }
  },
  {
    name: 'Chat API（統合エージェント経由）',
    endpoint: '/api/chat',
    payload: {
      message: 'ライトテーマに変更してBTCの日足を表示して',
      symbol: 'BTCUSDT',
      timeframe: '1d'
    }
  }
];

// テスト実行関数
async function runTest(testCase) {
  console.log(`\n🧪 テスト: ${testCase.name}`);
  console.log(`📡 エンドポイント: ${testCase.endpoint}`);
  console.log(`📤 ペイロード:`, JSON.stringify(testCase.payload, null, 2));
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}${testCase.endpoint}`, {
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
      const errorText = await response.text();
      console.log(`📝 エラー詳細: ${errorText.substring(0, 200)}...`);
      return false;
    }
    
    const data = await response.json();
    
    console.log(`✅ 成功 (${duration}ms)`);
    console.log(`📥 レスポンス概要:`, {
      success: data.success,
      mode: data.mode,
      agent: data.agent,
      responseLength: data.response?.length || data.message?.length || 0,
      executedOperations: data.executedOperations?.length || 0
    });
    
    // 詳細ログ（デバッグ用）
    if (data.success) {
      console.log(`💬 応答: ${(data.response || data.message || '応答なし').substring(0, 100)}...`);
      if (data.executedOperations?.length > 0) {
        console.log(`🎯 実行された操作: ${data.executedOperations.map(op => op.description).join(', ')}`);
      }
    } else {
      console.log(`❌ エラー: ${data.error}`);
      console.log(`📝 詳細: ${data.details}`);
    }
    
    return data.success;
    
  } catch (error) {
    console.log(`❌ 接続エラー: ${error.message}`);
    return false;
  }
}

// 全テスト実行
async function runAllTests() {
  console.log('🚀 新しい統合エージェントAPI構造 - 動作テスト開始');
  console.log('='.repeat(60));
  
  let successCount = 0;
  let totalCount = testCases.length;
  
  for (const testCase of testCases) {
    const success = await runTest(testCase);
    if (success) successCount++;
    
    // テスト間に少し間隔を空ける
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 テスト結果: ${successCount}/${totalCount} 成功`);
  
  if (successCount === totalCount) {
    console.log('🎉 全てのテストが成功しました！新しい構造は正常に動作しています。');
  } else {
    console.log('⚠️ 一部のテストが失敗しました。ログを確認してください。');
  }
  
  return successCount === totalCount;
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(allPassed => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ テスト実行エラー:', error);
      process.exit(1);
    });
} 