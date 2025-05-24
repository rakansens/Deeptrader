// socket-io-server.mjs
// Socket.IOサーバー（統一設定対応・ポート競合解決版）
import { createServer } from 'http';
import { Server } from 'socket.io';
import { URL } from 'url';

// 🔧 統一設定からポート読み込み
const SOCKETIO_PORT = parseInt(process.env.SOCKETIO_PORT || '8080');
const CORS_ORIGINS = [
  "http://localhost:3000", 
  "http://localhost:3001", 
  "http://localhost:3002", 
  "http://localhost:3003"
];

// HTTPサーバー作成
const httpServer = createServer((req, res) => {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // UI操作のHTTPエンドポイント
  if (req.method === 'POST' && req.url === '/ui-operation') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const operation = JSON.parse(body);
        console.log('📡 HTTP経由でUI操作受信:', operation);
        
        // Socket.IOクライアントにブロードキャスト
        io.emit('ui_operation_from_api', {
          ...operation,
          timestamp: new Date().toISOString(),
          source: 'http_api'
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'UI操作をSocket.IOクライアントにブロードキャストしました',
          operation: operation.description
        }));
        
      } catch (error) {
        console.log('⚠️ UI操作HTTP処理エラー:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'JSON解析エラー'
        }));
      }
    });
    
    return;
  }
  
  // ヘルスチェックエンドポイント
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      clients: clients.size,
      port: SOCKETIO_PORT,
      uptime: process.uptime()
    }));
    return;
  }
  
  // 他のHTTPリクエストは404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Socket.IOサーバー設定
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  // パフォーマンス最適化
  pingTimeout: 30000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6 // 1MB
});

console.log(`🚀 Socket.IOサーバー起動中... (ポート: ${SOCKETIO_PORT})`);

// クライアント管理（パフォーマンス監視付き）
const clients = new Set();
const connectionMetrics = {
  totalConnections: 0,
  currentConnections: 0,
  messagesProcessed: 0,
  errors: 0
};

io.on('connection', (socket) => {
  connectionMetrics.totalConnections++;
  connectionMetrics.currentConnections++;
  
  console.log(`🔗 Socket.IOクライアント接続: ${socket.id} (現在: ${connectionMetrics.currentConnections})`);
  clients.add(socket);
  
  // 接続確認メッセージ
  socket.emit('connection_established', {
    message: 'Socket.IOサーバーに正常接続',
    serverId: socket.id,
    timestamp: new Date().toISOString(),
    serverInfo: {
      port: SOCKETIO_PORT,
      clientCount: clients.size
    }
  });
  
  // WebSocket UI操作メッセージのハンドリング
  socket.on('ui_operation', (data) => {
    try {
      connectionMetrics.messagesProcessed++;
      console.log('🎯 UI操作受信:', data);
      
      // 他のクライアントにブロードキャスト
      socket.broadcast.emit('ui_operation_broadcast', {
        ...data,
        fromClient: socket.id,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      connectionMetrics.errors++;
      console.error('❌ UI操作処理エラー:', error);
    }
  });
  
  // 汎用メッセージハンドリング
  socket.on('message', (data) => {
    try {
      connectionMetrics.messagesProcessed++;
      console.log(`💬 メッセージ受信 from ${socket.id}:`, data);
      
      // エコーバック
      socket.emit('message_response', {
        original: data,
        response: `Socket.IOサーバーが受信: ${JSON.stringify(data)}`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      connectionMetrics.errors++;
      console.error('❌ メッセージ処理エラー:', error);
    }
  });
  
  // 切断時の処理
  socket.on('disconnect', (reason) => {
    connectionMetrics.currentConnections--;
    console.log(`❌ Socket.IOクライアント切断: ${socket.id} (理由: ${reason}) (現在: ${connectionMetrics.currentConnections})`);
    clients.delete(socket);
  });
  
  // エラーハンドリング
  socket.on('error', (error) => {
    connectionMetrics.errors++;
    console.log(`⚠️ Socket.IOエラー (${socket.id}):`, error);
  });
});

// HTTPサーバー起動（エラーハンドリング強化）
httpServer.listen(SOCKETIO_PORT, '127.0.0.1')
  .on('listening', () => {
    console.log(`✅ Socket.IOサーバー起動完了: http://127.0.0.1:${SOCKETIO_PORT}`);
    console.log(`📡 WebSocket & Polling対応済み`);
    console.log(`🔌 HTTP UI操作エンドポイント: POST /ui-operation`);
    console.log(`💚 ヘルスチェック: GET /health`);
  })
  .on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ ポート ${SOCKETIO_PORT} は既に使用中です`);
      console.log(`💡 別のポートを試すか、既存のプロセスを停止してください:`);
      console.log(`   lsof -ti:${SOCKETIO_PORT} | xargs kill -9`);
    } else {
      console.error('❌ Socket.IOサーバー起動エラー:', error);
    }
    process.exit(1);
  });

// パフォーマンス監視（5分間隔）
setInterval(() => {
  console.log('📊 Socket.IOサーバーメトリクス:', {
    ...connectionMetrics,
    uptime: Math.floor(process.uptime()),
    memoryUsage: process.memoryUsage()
  });
}, 5 * 60 * 1000);

// グローバルなUI操作ブロードキャスト関数（API経由で呼び出し可能）
globalThis.broadcastUIOperation = (operation) => {
  console.log('📢 UI操作グローバルブロードキャスト:', operation);
  io.emit('ui_operation_global', {
    ...operation,
    timestamp: new Date().toISOString(),
    source: 'server_api'
  });
};

// プロセス終了時の処理
process.on('SIGINT', () => {
  console.log('\n🛑 Socket.IOサーバー終了中...');
  console.log('📊 最終メトリクス:', connectionMetrics);
  
  io.close(() => {
    httpServer.close(() => {
      console.log('✅ Socket.IOサーバー正常終了');
      process.exit(0);
    });
  });
});

export { io }; 