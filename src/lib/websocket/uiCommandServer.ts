// src/lib/websocket/uiCommandServer.ts
// WebSocketベースのUI操作命令サーバー
import { WebSocketServer } from 'ws';
import { logger } from '@/lib/logger';

// UI操作命令の型定義
export interface UICommand {
  id: string;
  type: 'ui_operation';
  operation: string;
  payload: Record<string, any>;
  timestamp: string;
}

// WebSocketクライアント管理
class UICommandServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<any> = new Set();

  initialize(port: number = 8080) {
    if (this.wss) {
      logger.warn('WebSocketサーバーは既に初期化済みです');
      return;
    }

    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws) => {
      logger.info('UI WebSocketクライアント接続');
      this.clients.add(ws);

      ws.on('close', () => {
        logger.info('UI WebSocketクライアント切断');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('UI WebSocketエラー:', error);
        this.clients.delete(ws);
      });

      // 接続確認メッセージ
      ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'UI Command WebSocket接続完了',
        timestamp: new Date().toISOString(),
      }));
    });

    logger.info(`UI Command WebSocketサーバー開始: ws://localhost:${port}`);
  }

  // UI操作命令をすべてのクライアントに送信
  broadcastUICommand(command: UICommand) {
    if (!this.wss || this.clients.size === 0) {
      logger.warn('WebSocketクライアントが接続されていません');
      return false;
    }

    const message = JSON.stringify(command);
    let sentCount = 0;

    this.clients.forEach((ws) => {
      try {
        if (ws.readyState === 1) { // OPEN状態
          ws.send(message);
          sentCount++;
        } else {
          this.clients.delete(ws);
        }
      } catch (error) {
        logger.error('WebSocketメッセージ送信エラー:', error);
        this.clients.delete(ws);
      }
    });

    logger.info(`UI操作命令を${sentCount}クライアントに送信: ${command.operation}`);
    return sentCount > 0;
  }

  // 特定のUI操作を実行
  async executeUIOperation(operation: string, payload: Record<string, any>): Promise<boolean> {
    const command: UICommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'ui_operation',
      operation,
      payload,
      timestamp: new Date().toISOString(),
    };

    return this.broadcastUICommand(command);
  }

  // クライアント数取得
  getClientCount(): number {
    return this.clients.size;
  }

  // サーバー停止
  close() {
    if (this.wss) {
      this.wss.close();
      this.clients.clear();
      this.wss = null;
      logger.info('UI Command WebSocketサーバー停止');
    }
  }
}

// シングルトンインスタンス
export const uiCommandServer = new UICommandServer();

// サーバー初期化（開発環境のみ）
if (process.env.NODE_ENV === 'development') {
  try {
    uiCommandServer.initialize(8080);
  } catch (error) {
    logger.error('UI Command WebSocketサーバー初期化エラー:', error);
  }
} 