// test-eth-switch.mjs
// ETHUSDTに切り替えるWebSocketクライアント
import WebSocket from 'ws';

console.log('🔄 ETHUSDTに切り替え中...');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('✅ WebSocket接続成功');
  
  // ETHUSDTに切り替えコマンドを送信
  const ethSwitchCommand = {
    id: 'eth_switch_' + Date.now(),
    type: 'ui_operation',
    operation: 'change_symbol',
    payload: { symbol: 'ETHUSDT' },
    timestamp: new Date().toISOString(),
  };
  
  ws.send(JSON.stringify(ethSwitchCommand));
  console.log('📤 ETHUSDT切り替えコマンド送信完了');
  
  // 2秒後に接続を閉じる
  setTimeout(() => {
    ws.close();
    console.log('🎉 ETHUSDT切り替え完了！ブラウザでチャートを確認してください');
    process.exit(0);
  }, 2000);
});

ws.on('error', (error) => {
  console.log('❌ WebSocket接続エラー:', error.message);
  console.log('💡 test-simple-ui-server.mjsが動作していることを確認してください');
  process.exit(1);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📥 サーバー応答:', message.message || message.type);
  } catch (error) {
    console.log('📥 サーバー応答受信');
  }
}); 