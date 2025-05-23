// tests/integration/test-agent-tools.mjs
// 各エージェントのツール実行詳細テスト

import WebSocket from 'ws';

const BASE_URL = 'http://localhost:3002';

// WebSocket接続テスト
async function testWebSocketConnection() {
  console.log('\n🔌 WebSocket接続テスト');
  console.log('='.repeat(40));
  
  const tests = [
    { port: 8080, description: 'Socket.IOサーバー' },
    { port: 8081, description: 'WebSocketサーバー' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`📡 ${test.description} (ポート${test.port})に接続中...`);
      
      const ws = new WebSocket(`ws://127.0.0.1:${test.port}`);
      
      const result = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve({ success: false, error: 'タイムアウト' });
        }, 3000);
        
        ws.on('open', () => {
          clearTimeout(timeout);
          
          // テストメッセージ送信
          const testMessage = {
            id: `test_${Date.now()}`,
            type: 'ui_operation',
            operation: 'change_symbol',
            payload: { symbol: 'BTCUSDT' },
            timestamp: new Date().toISOString(),
            source: 'tool_test'
          };
          
          ws.send(JSON.stringify(testMessage));
          
          setTimeout(() => {
            ws.close();
            resolve({ success: true });
          }, 1000);
        });
        
        ws.on('error', (error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message });
        });
      });
      
      if (result.success) {
        console.log(`✅ ${test.description}: 接続成功`);
      } else {
        console.log(`❌ ${test.description}: 接続失敗 - ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.description}: エラー - ${error.message}`);
    }
  }
}

// Socket.IO HTTP エンドポイントテスト
async function testSocketIOHTTP() {
  console.log('\n📡 Socket.IO HTTP エンドポイントテスト');
  console.log('='.repeat(40));
  
  try {
    const testOperation = {
      type: 'ui_operation',
      operation: 'change_symbol',
      payload: { symbol: 'ETHUSDT' },
      description: 'テスト用ETH切り替え',
      source: 'tool_test',
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 UI操作をSocket.IOサーバーに送信中...');
    
    const response = await fetch('http://127.0.0.1:8080/ui-operation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOperation)
    });
    
    if (response.ok) {
      console.log('✅ Socket.IO HTTP: UI操作送信成功');
      const data = await response.text();
      if (data) console.log(`📥 応答: ${data}`);
    } else {
      console.log(`❌ Socket.IO HTTP: 失敗 - ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.log(`❌ Socket.IO HTTP: エラー - ${error.message}`);
  }
}

// Pure エージェントツールテスト
async function testPureAgentTools() {
  console.log('\n🎯 Pure エージェントツールテスト');
  console.log('='.repeat(40));
  
  const testCases = [
    { message: 'ETHに切り替えて', expectedOps: 1, description: '銘柄変更' },
    { message: 'ダークテーマに変更して4時間足を表示', expectedOps: 2, description: '複合操作' },
    { message: 'RSIインジケーターをオンにして', expectedOps: 1, description: 'インジケーター操作' },
    { message: 'ライトテーマに戻して', expectedOps: 1, description: 'テーマ復元' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 テスト: ${testCase.description}`);
      console.log(`💬 メッセージ: "${testCase.message}"`);
      
      const response = await fetch(`${BASE_URL}/api/agents/pure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testCase.message })
      });
      
      if (!response.ok) {
        console.log(`❌ HTTP エラー: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.success) {
        const operations = data.executedOperations || [];
        console.log(`✅ 成功: ${operations.length}個の操作実行`);
        console.log(`📝 応答: ${data.message?.substring(0, 100)}...`);
        
        if (operations.length > 0) {
          console.log(`🎯 実行された操作:`);
          operations.forEach((op, i) => {
            console.log(`   ${i + 1}. ${op.description}`);
          });
        }
        
        if (operations.length !== testCase.expectedOps) {
          console.log(`⚠️ 期待操作数: ${testCase.expectedOps}, 実際: ${operations.length}`);
        }
      } else {
        console.log(`❌ 失敗: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`❌ エラー: ${error.message}`);
    }
    
    // テスト間の間隔
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// MASTRA エージェントツールテスト
async function testMASTRAAgentTools() {
  console.log('\n🤖 MASTRA エージェントツールテスト');
  console.log('='.repeat(40));
  
  const testCases = [
    { 
      message: 'BTCの4時間足に変更して', 
      expectedAgent: 'ui',
      description: 'UI委任テスト'
    },
    { 
      message: '現在のチャートを分析してトレンドを教えて', 
      expectedAgent: 'trading',
      description: 'トレーディング委任テスト'
    },
    { 
      message: '今日の市場ニュースを調べて', 
      expectedAgent: 'research',
      description: 'リサーチ委任テスト'
    },
    { 
      message: '移動平均戦略をバックテストして', 
      expectedAgent: 'backtest',
      description: 'バックテスト委任テスト'
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 テスト: ${testCase.description}`);
      console.log(`💬 メッセージ: "${testCase.message}"`);
      
      const response = await fetch(`${BASE_URL}/api/agents/mastra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: testCase.message,
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
        console.log(`✅ 成功: MASTRA処理完了`);
        console.log(`📝 応答: ${data.message?.substring(0, 150)}...`);
        
        // 委任先エージェント確認
        if (data.message && data.message.includes('【委任先】')) {
          const targetMatch = data.message.match(/【委任先】:\s*(.+)/);
          if (targetMatch) {
            const target = targetMatch[1].trim();
            console.log(`🎯 委任先: ${target}`);
            
            // 期待委任先チェック
            const expectedTargets = {
              'ui': ['UIコントロールスペシャリスト'],
              'trading': ['トレーディングアドバイザー'],
              'research': ['市場リサーチスペシャリスト'],
              'backtest': ['バックテストスペシャリスト']
            };
            
            const expected = expectedTargets[testCase.expectedAgent];
            if (expected && expected.some(exp => target.includes(exp))) {
              console.log(`✅ 委任先正しい: ${testCase.expectedAgent} → ${target}`);
            } else {
              console.log(`⚠️ 委任先不一致: 期待 ${testCase.expectedAgent}, 実際 ${target}`);
            }
          }
        }
        
      } else {
        console.log(`❌ 失敗: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`❌ エラー: ${error.message}`);
    }
    
    // テスト間の間隔
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// 統合エージェントフォールバックテスト
async function testUnifiedAgentFallback() {
  console.log('\n🔄 統合エージェントフォールバックテスト');
  console.log('='.repeat(40));
  
  const testCases = [
    { 
      strategy: 'auto',
      message: 'SOLに切り替えて',
      description: '自動選択（MASTRA→Pureフォールバック）'
    },
    { 
      strategy: 'mastra',
      message: 'チャートを分析して',
      description: 'MASTRA明示指定'
    },
    { 
      strategy: 'pure',
      message: 'ダークテーマに変更',
      description: 'Pure明示指定'
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 テスト: ${testCase.description}`);
      console.log(`🎚️ 戦略: ${testCase.strategy}`);
      console.log(`💬 メッセージ: "${testCase.message}"`);
      
      const response = await fetch(`${BASE_URL}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: testCase.message,
          strategy: testCase.strategy,
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
        console.log(`✅ 成功: 実行モード ${data.mode}`);
        console.log(`📝 応答: ${data.message?.substring(0, 100)}...`);
        
        if (data.fallbackReason) {
          console.log(`🔄 フォールバック理由: ${data.fallbackReason}`);
        }
        
        if (data.executedOperations && data.executedOperations.length > 0) {
          console.log(`🎯 実行操作: ${data.executedOperations.length}個`);
        }
      } else {
        console.log(`❌ 失敗: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`❌ エラー: ${error.message}`);
    }
    
    // テスト間の間隔
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}

// メイン実行
async function runAllToolTests() {
  console.log('🔧 エージェントツール実行詳細テスト開始');
  console.log('='.repeat(60));
  
  try {
    await testWebSocketConnection();
    await testSocketIOHTTP();
    await testPureAgentTools();
    await testMASTRAAgentTools();
    await testUnifiedAgentFallback();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 全てのツールテストが完了しました！');
    
  } catch (error) {
    console.error('❌ ツールテスト実行エラー:', error);
  }
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllToolTests()
    .then(() => {
      console.log('✅ ツールテスト完了');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ ツールテスト失敗:', error);
      process.exit(1);
    });
} 