// test-simple-ui-server.mjs
// 簡単なUI操作テスト用WebSocketサーバー
import { WebSocketServer } from 'ws';

console.log('🚀 UIコマンドサーバー起動中...');
const wss = new WebSocketServer({ port: 8080 });
console.log('✅ WebSocketサーバー起動: ws://localhost:8080');

wss.on('connection', (ws) => {
  console.log('🔗 フロントエンドクライアント接続');
  
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'UIテストサーバーに接続しました',
    timestamp: new Date().toISOString(),
  }));
  
  // 5秒後にタイムフレーム変更テスト
  setTimeout(() => {
    const testCommand = {
      id: 'test_' + Date.now(),
      type: 'ui_operation',
      operation: 'change_timeframe',
      payload: { timeframe: '4h' },
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(testCommand));
    console.log('📤 テストコマンド送信: タイムフレーム変更 (4h)');
  }, 5000);
  
  // 10秒後にテーマ変更テスト
  setTimeout(() => {
    const testCommand = {
      id: 'test_' + Date.now(),
      type: 'ui_operation', 
      operation: 'change_theme',
      payload: { theme: 'dark' },
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(testCommand));
    console.log('📤 テストコマンド送信: テーマ変更 (dark)');
  }, 10000);
  
  // 15秒後にインジケーター切り替えテスト
  setTimeout(() => {
    const testCommand = {
      id: 'test_' + Date.now(),
      type: 'ui_operation',
      operation: 'toggle_indicator', 
      payload: { indicator: 'RSI', enabled: true },
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(testCommand));
    console.log('📤 テストコマンド送信: RSIインジケーター有効化');
  }, 15000);
  
  ws.on('close', () => {
    console.log('❌ クライアント切断');
  });
});

// 60秒後に自動終了
setTimeout(() => {
  console.log('⏰ テスト終了');
  process.exit(0);
}, 60000);

console.log('💡 ブラウザで http://localhost:3000 を開いてテスト結果を確認してください'); 