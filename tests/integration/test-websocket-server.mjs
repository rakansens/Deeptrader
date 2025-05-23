// test-websocket-server.mjs
// WebSocketサーバーの単体テスト
import { WebSocketServer } from 'ws';

console.log('🚀 WebSocketサーバーテスト開始...');

const wss = new WebSocketServer({ 
  port: 8080,
  host: 'localhost'
});

console.log('📡 WebSocketサーバーが ws://localhost:8080 で起動中...');

wss.on('connection', (ws, req) => {
  console.log('✅ クライアント接続:', req.socket.remoteAddress);
  
  // 接続確認メッセージ
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'WebSocketテストサーバーに接続しました',
    timestamp: new Date().toISOString(),
  }));

  // テストメッセージを3秒後に送信
  setTimeout(() => {
    const testCommand = {
      id: 'test_cmd_123',
      type: 'ui_operation',
      operation: 'change_timeframe',
      payload: { timeframe: '4h' },
      timestamp: new Date().toISOString(),
    };
    
    ws.send(JSON.stringify(testCommand));
    console.log('📤 テストコマンド送信:', testCommand.operation);
  }, 3000);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📥 受信メッセージ:', message);
    } catch (error) {
      console.log('📥 受信データ:', data.toString());
    }
  });

  ws.on('close', () => {
    console.log('❌ クライアント切断');
  });

  ws.on('error', (error) => {
    console.error('⚠️ WebSocketエラー:', error);
  });
});

wss.on('error', (error) => {
  console.error('🚨 サーバーエラー:', error);
});

console.log('🔄 WebSocketサーバーが正常に起動しました');
console.log('💡 別ターミナルで以下のコマンドでテスト:');
console.log('   node test-websocket-client.mjs');

// プロセス終了時にサーバーを停止
process.on('SIGINT', () => {
  console.log('\n🛑 WebSocketサーバーを停止中...');
  wss.close(() => {
    console.log('✅ WebSocketサーバーが停止しました');
    process.exit(0);
  });
}); 