import { WebSocketServer, WebSocket } from 'ws';

// シンプルなログ関数
const logger = {
  info: (...args: any[]) => console.info('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args)
};

interface ClientInfo {
  ws: WebSocket;
  userId: string;
  ip: string;
}

// 🔧 Phase 5A: 命名衝突解決（@/types/commonのStreamInfoと区別）
interface HubStreamInfo {
  ws: WebSocket;
  clients: Set<ClientInfo>;
  retries: number;
  pingTimer?: NodeJS.Timeout;
  reconnectTimer?: NodeJS.Timeout;
}

// 環境変数から設定を取得するか、デフォルト値を使用
const BINANCE_WS_BASE_URL = process.env.BINANCE_WS_BASE_URL || 'wss://stream.binance.com:9443';
const HUB_JWT_SECRET = process.env.HUB_JWT_SECRET || 'change-me';

// Redis や Kafka なしでも動作可能なように設定
let ENABLE_REDIS = false;
let ENABLE_KAFKA = false;

try {
  // オプショナルな機能
  // Redis や Kafka がなくてもエラーにしない
  const Redis = require('ioredis');
  ENABLE_REDIS = true;
} catch (err) {
  logger.warn('Redis is not available, rate limiter disabled');
}

// ストリーム管理
const streams = new Map<string, HubStreamInfo>();

function broadcast(symbol: string, data: Buffer) {
  const info = streams.get(symbol);
  if (!info) return;
  for (const client of info.clients) {
    client.ws.send(data);
  }
}

function connectBinance(stream: string): HubStreamInfo {
  const info: HubStreamInfo = {
    // @ts-expect-error: will be set below in the connect function
    ws: null,
    clients: new Set(),
    retries: 0,
  };

  const connect = () => {
    if (info.reconnectTimer) {
      clearTimeout(info.reconnectTimer);
      info.reconnectTimer = undefined;
    }
    const ws = new WebSocket(`${BINANCE_WS_BASE_URL}/ws/${stream}`);
    info.ws = ws;

    const schedulePing = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
        info.pingTimer = setTimeout(schedulePing, 30000);
      }
    };
    const stopPing = () => {
      if (info.pingTimer) {
        clearTimeout(info.pingTimer);
        info.pingTimer = undefined;
      }
    };

    ws.on('open', () => {
      info.retries = 0;
      schedulePing();
      logger.info(`Connected to Binance stream: ${stream}`);
    });
    ws.on('message', (data: Buffer) => broadcast(stream, data));
    const onClose = () => {
      stopPing();
      if (info.clients.size > 0) {
        info.retries += 1;
        const delay = Math.min(30000, 2 ** info.retries * 1000);
        logger.warn(`Reconnecting to stream ${stream} in ${delay}ms (attempt ${info.retries})`);
        info.reconnectTimer = setTimeout(connect, delay);
      } else {
        streams.delete(stream);
      }
    };
    ws.on('close', onClose);
    ws.on('error', onClose);
  };

  connect();
  return info;
}

// シンプルなメモリ内レート制限（Redis不要）
const rateLimits = new Map<string, { count: number, expire: number }>();

async function allow(ip: string, userId: string, stream?: string) {
  if (ENABLE_REDIS) {
    // Redis が利用可能な場合はここに実装
    return true;
  }

  // Redis がない場合はメモリ内で簡易的に実装
  const now = Date.now();
  const streamSpecific = stream && /depth|ticker|@100ms/.test(stream);
  const key = streamSpecific 
    ? `rl:${ip}:${userId}:${stream}`
    : `rl:${ip}:${userId}`;
  
  const limit = rateLimits.get(key);
  
  // 期限切れエントリを削除
  if (limit && limit.expire < now) {
    rateLimits.delete(key);
  }
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, { 
      count: 1, 
      expire: now + (streamSpecific ? 100 : 200)
    });
    return true;
  }
  
  const entry = rateLimits.get(key)!;
  entry.count += 1;                       // increment for this attempt
  return entry.count <= 1;                // allow only the first request per window
}

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws: WebSocket, req: any) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const token = url.searchParams.get('token');
  const streamParam = url.searchParams.get('stream');
  let userId = 'anonymous'; // デフォルト値を設定
  
  if (token) {
    try {
      // 簡易的なトークン検証（実際には jwt ライブラリを使用）
      userId = token;
    } catch (err: unknown) {
      // トークン検証に失敗した場合は警告ログを出すが接続は維持
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.warn(`Invalid token: ${errorMessage}`);
    }
  }
  
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
  const client: ClientInfo = { ws, userId, ip };

  logger.info(`Client connected: ${ip} (${userId})`);

  // URL パラメータによる自動サブスクライブ
  if (streamParam) {
    let info = streams.get(streamParam);
    if (!info) {
      info = connectBinance(streamParam);
      streams.set(streamParam, info);
    }
    info.clients.add(client);
    logger.info(`Client subscribed to: ${streamParam}`);
  }

  ws.on('message', async (msg: Buffer) => {
    let data: any;
    try {
      data = JSON.parse(msg.toString());
    } catch {
      return;
    }
    
    // ストリーム情報を取得してレート制限チェック
    const stream = data.stream || streamParam;
    if (!(await allow(ip, userId, stream))) {
      ws.send(JSON.stringify({ error: 'rate limited' }));
      return;
    }
    
    if (data.type === 'subscribe' && typeof data.stream === 'string') {
      let info = streams.get(data.stream);
      if (!info) {
        info = connectBinance(data.stream);
        streams.set(data.stream, info);
      }
      info.clients.add(client);
      logger.info(`Client subscribed to: ${data.stream}`);
    } else if (data.type === 'unsubscribe' && typeof data.stream === 'string') {
      const info = streams.get(data.stream);
      if (info) {
        info.clients.delete(client);
        logger.info(`Client unsubscribed from: ${data.stream}`);
        if (info.clients.size === 0) {
          info.ws.close();
          streams.delete(data.stream);
          logger.info(`Closed stream: ${data.stream} (no clients)`);
        }
      }
    }
  });

  ws.on('close', () => {
    logger.info(`Client disconnected: ${ip} (${userId})`);
    for (const [stream, info] of streams) {
      if (info.clients.delete(client) && info.clients.size === 0) {
        info.ws.close();
        streams.delete(stream);
        logger.info(`Closed stream: ${stream} (no clients)`);
      }
    }
  });
});

logger.info('WebSocket Hub running on port 8080');
