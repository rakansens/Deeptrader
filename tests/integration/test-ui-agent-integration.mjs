// test-ui-agent-integration.mjs
// UIエージェントとWebSocket連携の統合テスト
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';

console.log('🧪 UI操作エージェント統合テスト開始');

// テストサーバー起動
const wss = new WebSocketServer({ port: 8080 });
console.log('📡 テスト用WebSocketサーバー起動: ws://localhost:8080');

// クライアント接続管理
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('✅ フロントエンドクライアント接続');
  clients.add(ws);

  ws.on('close', () => {
    console.log('❌ フロントエンドクライアント切断');
    clients.delete(ws);
  });

  // 接続確認
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'UIテストサーバーに接続しました',
    timestamp: new Date().toISOString(),
  }));
});

// UI操作テストシーケンス
const uiOperationTests = [
  {
    name: 'タイムフレーム変更テスト',
    operation: 'change_timeframe',
    payload: { timeframe: '4h' },
    expected: 'チャートが4時間足に変更される'
  },
  {
    name: 'テーマ変更テスト',
    operation: 'change_theme',
    payload: { theme: 'dark' },
    expected: 'ダークテーマに変更される'
  },
  {
    name: 'インジケーター切り替えテスト',
    operation: 'toggle_indicator',
    payload: { indicator: 'RSI', enabled: true },
    expected: 'RSIインジケーターが表示される'
  },
  {
    name: '銘柄変更テスト',
    operation: 'change_symbol',
    payload: { symbol: 'ETHUSDT' },
    expected: 'チャートがETHUSDTに変更される'
  },
  {
    name: 'チャートズームテスト',
    operation: 'zoom_chart',
    payload: { action: 'in', factor: 1.5 },
    expected: 'チャートが拡大される'
  }
];

// テスト実行関数
function executeUIOperationTest(test, index) {
  return new Promise((resolve) => {
    console.log(`\n🎯 テスト${index + 1}: ${test.name}`);
    console.log(`   操作: ${test.operation}`);
    console.log(`   ペイロード:`, test.payload);
    console.log(`   期待結果: ${test.expected}`);

    const command = {
      id: `test_${index}_${Date.now()}`,
      type: 'ui_operation',
      operation: test.operation,
      payload: test.payload,
      timestamp: new Date().toISOString(),
    };

    // すべてのクライアントに送信
    let sentCount = 0;
    clients.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(command));
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`✅ UI操作命令を${sentCount}クライアントに送信`);
      console.log('⏳ フロントエンドでの実行を待機中...');
    } else {
      console.log('⚠️ 接続中のクライアントがありません');
    }

    // 3秒待機してから次のテストへ
    setTimeout(resolve, 3000);
  });
}

// メインテストシーケンス
async function runIntegrationTests() {
  console.log('\n🚀 UI操作テストシーケンス開始');
  console.log('💡 ブラウザで http://localhost:3000 を開いて右下のUI Command Consoleを確認してください');
  
  // 初期接続待機
  console.log('\n⏳ フロントエンドクライアントの接続を30秒間待機...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  if (clients.size === 0) {
    console.log('⚠️ フロントエンドクライアントが接続されていません');
    console.log('   ブラウザでアプリを開いてWebSocket接続を確認してください');
    return;
  }

  console.log(`✅ ${clients.size}個のクライアントが接続中 - テスト開始`);

  // 順次テスト実行
  for (let i = 0; i < uiOperationTests.length; i++) {
    await executeUIOperationTest(uiOperationTests[i], i);
  }

  console.log('\n🎉 すべてのUI操作テストが完了しました');
  console.log('\n📊 結果確認:');
  console.log('   1. ブラウザでチャートの変更を確認');
  console.log('   2. UI Command Consoleでコマンド履歴を確認');
  console.log('   3. コンソールでエラーがないことを確認');
}

// 5秒後にテスト開始
setTimeout(runIntegrationTests, 5000);

// 60秒後に自動終了
setTimeout(() => {
  console.log('\n⏰ テスト時間終了 - サーバーを停止します');
  wss.close();
  process.exit(0);
}, 60000);

console.log('🔄 統合テスト準備完了 - 5秒後に開始します'); 