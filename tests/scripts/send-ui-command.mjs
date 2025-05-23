// send-ui-command.mjs
// 常駐サーバー向けUI操作送信クライアント
import WebSocket from 'ws';

const operation = process.argv[2] || 'change_symbol';
const symbol = process.argv[3] || 'ETHUSDT';

console.log(`🎯 UI操作実行: ${operation} → ${symbol}`);

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('✅ WebSocket接続成功');
  
  const command = {
    id: `ui_${Date.now()}`,
    type: 'ui_operation',
    operation,
    payload: { symbol },
    timestamp: new Date().toISOString(),
  };
  
  ws.send(JSON.stringify(command));
  console.log('📤 UI操作コマンド送信完了');
  
  setTimeout(() => {
    ws.close();
    console.log('🎉 操作完了！ブラウザでチャートを確認してください');
    process.exit(0);
  }, 1000);
});

ws.on('message', (data) => {
  try {
    const response = JSON.parse(data);
    console.log('📥 サーバーレスポンス:', response.message || response.operation);
  } catch (error) {
    console.log('📥 サーバーメッセージ受信');
  }
});

ws.on('error', (error) => {
  console.log('❌ WebSocket接続エラー:', error.message);
  console.log('💡 websocket-server-permanent.mjsが動作していることを確認してください');
  process.exit(1);
}); 