// src/server/ui-websocket-server.mjs
// UI操作用WebSocketサーバー - エージェントからのUI操作コマンドを受信してフロントエンドに転送
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

console.log('🚀 UI WebSocketサーバー起動中...');

const server = createServer();
const wss = new WebSocketServer({ server });

// 接続中のクライアント管理
const clients = new Set();

wss.on('connection', (ws, req) => {
  console.log('✅ クライアント接続:', req.socket.remoteAddress);
  clients.add(ws);
  
  // 接続確認メッセージ
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'UI WebSocketサーバーに接続しました',
    timestamp: new Date().toISOString(),
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📥 受信メッセージ:', message);
      
      // エージェントからのUI操作コマンドを全クライアントに転送
      if (message.type === 'ui_operation') {
        broadcastToClients(message);
      }
    } catch (error) {
      console.error('メッセージ解析エラー:', error);
    }
  });

  ws.on('close', () => {
    console.log('❌ クライアント切断');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('⚠️ WebSocketエラー:', error);
    clients.delete(ws);
  });
});

// 全クライアントにメッセージをブロードキャスト
function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);
  console.log(`📤 ${clients.size}個のクライアントにブロードキャスト:`, message.operation);
  
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(messageStr);
    }
  });
}

// エージェントからのUI操作コマンドを受信するHTTPエンドポイント
server.on('request', async (req, res) => {
  if (req.method === 'POST' && req.url === '/ui-command') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const command = JSON.parse(body);
        console.log('🎯 HTTPからUI操作コマンド受信:', command);
        
        // WebSocketクライアントに転送
        broadcastToClients({
          id: command.id || `cmd_${Date.now()}`,
          type: 'ui_operation',
          operation: command.operation,
          payload: command.payload,
          timestamp: new Date().toISOString(),
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'UI操作コマンドを送信しました' }));
      } catch (error) {
        console.error('コマンド処理エラー:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.WS_PORT || 8080;
server.listen(PORT, () => {
  console.log(`✅ UI WebSocketサーバーが起動しました`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP API: http://localhost:${PORT}/ui-command`);
});

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  console.log('\n🛑 サーバーを停止中...');
  
  // 全クライアントに切断通知
  clients.forEach((client) => {
    client.close();
  });
  
  server.close(() => {
    console.log('✅ サーバーが停止しました');
    process.exit(0);
  });
}); 