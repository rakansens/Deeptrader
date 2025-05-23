// test-websocket-client.mjs
// WebSocketクライアントのテスト
import WebSocket from 'ws';

console.log('🔌 WebSocketクライアントテスト開始...');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('✅ WebSocketサーバーに接続しました');
  
  // テスト用レスポンス送信
  setTimeout(() => {
    const response = {
      type: 'client_response',
      message: 'UI操作を受信しました',
      timestamp: new Date().toISOString(),
    };
    
    ws.send(JSON.stringify(response));
    console.log('📤 レスポンス送信:', response.message);
  }, 1000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📥 サーバーからメッセージ受信:');
    console.log('   タイプ:', message.type);
    console.log('   操作:', message.operation || message.message);
    console.log('   時刻:', message.timestamp);
    
    if (message.type === 'ui_operation') {
      console.log('🎨 UI操作コマンド受信 -', message.operation);
      console.log('   ペイロード:', message.payload);
      
      // UI操作シミュレーション
      console.log('🔧 UI操作を実行中...');
      setTimeout(() => {
        console.log('✅ UI操作完了');
      }, 500);
    }
  } catch (error) {
    console.log('📥 生データ受信:', data.toString());
  }
});

ws.on('close', () => {
  console.log('❌ WebSocket接続が終了しました');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('⚠️ WebSocketエラー:', error.message);
  process.exit(1);
});

// 自動終了（10秒後）
setTimeout(() => {
  console.log('\n⏰ テスト時間終了 - 接続を閉じます');
  ws.close();
}, 10000);

console.log('🔄 WebSocketクライアントが接続試行中...'); 