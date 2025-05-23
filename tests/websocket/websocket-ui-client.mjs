// websocket-ui-client.mjs
// エージェント用WebSocket UI操作送信クライアント
import WebSocket from 'ws';

/**
 * WebSocket経由でUI操作を送信
 * @param {string} operation - UI操作タイプ
 * @param {object} payload - 操作パラメータ
 * @returns {Promise<boolean>} - 送信成功/失敗
 */
export async function sendUIOperation(operation, payload) {
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket('ws://127.0.0.1:8080');
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket接続タイムアウト'));
      }, 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        
        const command = {
          id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'ui_operation',
          operation,
          payload,
          timestamp: new Date().toISOString(),
          source: 'mastra_agent'
        };
        
        console.log(`🤖 エージェント→WebSocket: ${operation}`, payload);
        ws.send(JSON.stringify(command));
        
        // 送信後すぐに切断
        setTimeout(() => {
          ws.close();
          resolve(true);
        }, 1000);
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.log('❌ WebSocket送信エラー:', error.message);
        reject(error);
      });
      
      ws.on('close', () => {
        clearTimeout(timeout);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 銘柄変更をWebSocket経由で送信
 */
export async function changeSymbol(symbol) {
  return sendUIOperation('change_symbol', { symbol });
}

/**
 * タイムフレーム変更をWebSocket経由で送信
 */
export async function changeTimeframe(timeframe) {
  return sendUIOperation('change_timeframe', { timeframe });
}

/**
 * テーマ変更をWebSocket経由で送信
 */
export async function changeTheme(theme) {
  return sendUIOperation('change_theme', { theme });
}

// CLIスクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const operation = process.argv[2];
  const param = process.argv[3];
  
  switch (operation) {
    case 'symbol':
      await changeSymbol(param || 'BTCUSDT');
      break;
    case 'timeframe':
      await changeTimeframe(param || '1h');
      break;
    case 'theme':
      await changeTheme(param || 'dark');
      break;
    default:
      console.log('使用方法: node websocket-ui-client.mjs <symbol|timeframe|theme> <値>');
  }
} 