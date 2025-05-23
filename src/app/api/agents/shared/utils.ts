// src/app/api/agents/shared/utils.ts
// エージェント共通ユーティリティ - ロジック重複削除と再利用性向上
// undefinedメッセージの防御的処理追加でTypeErrorを回避

import { UIOperation, AgentError } from './types';

// レスポンス生成ユーティリティ
export function createSuccessResponse(data: {
  message?: string;
  response?: string;
  mode: 'mastra' | 'pure' | 'hybrid' | 'fallback';
  agent?: string;
  executedOperations?: UIOperation[];
}) {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    ...data
  };
}

export function createErrorResponse(
  error: string | Error, 
  details?: string, 
  source: 'mastra' | 'pure' | 'websocket' | 'api' = 'api',
  mode: 'mastra' | 'pure' | 'hybrid' | 'fallback' = 'fallback'
) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  return {
    success: false,
    error: errorMessage,
    details: details || '不明なエラーが発生しました',
    timestamp: new Date().toISOString(),
    mode,
    source,
    ...(errorStack && { stack: errorStack })
  };
}

// 自然言語解析ユーティリティ（agent-pure.tsより移行・改善）
export function analyzeNaturalLanguageForUI(message: string): UIOperation[] {
  const operations: UIOperation[] = [];
  
  // メッセージの防御的チェック
  if (!message || typeof message !== 'string') {
    console.log('⚠️ analyzeNaturalLanguageForUI: 無効なメッセージ', { message, type: typeof message });
    return operations;
  }
  
  const lowerMessage = message.toLowerCase();
  
  // 銘柄変更の検出（拡張パターン）
  const symbolPatterns = [
    { patterns: ['eth', 'イーサ', 'ethereum'], symbol: 'ETHUSDT', name: 'Ethereum' },
    { patterns: ['btc', 'ビット', 'bitcoin'], symbol: 'BTCUSDT', name: 'Bitcoin' },
    { patterns: ['ada', 'エイダ', 'cardano'], symbol: 'ADAUSDT', name: 'Cardano' },
    { patterns: ['dot', 'ポルカ', 'polkadot'], symbol: 'DOTUSDT', name: 'Polkadot' },
    { patterns: ['sol', 'ソラナ', 'solana'], symbol: 'SOLUSDT', name: 'Solana' },
    { patterns: ['matic', 'マティック', 'polygon'], symbol: 'MATICUSDT', name: 'Polygon' },
  ];
  
  for (const symbolPattern of symbolPatterns) {
    if (symbolPattern.patterns.some(pattern => lowerMessage.includes(pattern))) {
      operations.push({
        type: 'change_symbol',
        payload: { symbol: symbolPattern.symbol },
        description: `${symbolPattern.name} (${symbolPattern.symbol})に銘柄変更`
      });
      break;
    }
  }
  
  // タイムフレーム変更の検出
  const timeframePatterns = [
    { patterns: ['1m', '1分'], timeframe: '1m', name: '1分足' },
    { patterns: ['5m', '5分'], timeframe: '5m', name: '5分足' },
    { patterns: ['15m', '15分'], timeframe: '15m', name: '15分足' },
    { patterns: ['1h', '1時間', '時間足'], timeframe: '1h', name: '1時間足' },
    { patterns: ['4h', '4時間', '4時間足'], timeframe: '4h', name: '4時間足' },
    { patterns: ['1d', '日足', 'daily', '日', 'デイリー'], timeframe: '1d', name: '日足' },
    { patterns: ['1w', '週足', 'weekly'], timeframe: '1w', name: '週足' },
  ];
  
  for (const tfPattern of timeframePatterns) {
    if (tfPattern.patterns.some(pattern => lowerMessage.includes(pattern))) {
      operations.push({
        type: 'change_timeframe',
        payload: { timeframe: tfPattern.timeframe },
        description: `${tfPattern.name}に変更`
      });
      break;
    }
  }
  
  // テーマ変更の検出
  if (lowerMessage.includes('ダーク') || lowerMessage.includes('dark')) {
    operations.push({
      type: 'change_theme',
      payload: { theme: 'dark' },
      description: 'ダークテーマに変更'
    });
  } else if (lowerMessage.includes('ライト') || lowerMessage.includes('light')) {
    operations.push({
      type: 'change_theme',
      payload: { theme: 'light' },
      description: 'ライトテーマに変更'
    });
  }
  
  // インジケーター操作の検出
  if (lowerMessage.includes('ma') || lowerMessage.includes('移動平均')) {
    operations.push({
      type: 'toggle_indicator',
      payload: { indicator: 'ma', enabled: !lowerMessage.includes('オフ') && !lowerMessage.includes('無効') },
      description: '移動平均線の表示切り替え'
    });
  }
  
  if (lowerMessage.includes('rsi')) {
    operations.push({
      type: 'toggle_indicator',
      payload: { indicator: 'rsi', enabled: !lowerMessage.includes('オフ') && !lowerMessage.includes('無効') },
      description: 'RSIインジケーターの表示切り替え'
    });
  }
  
  return operations;
}

// WebSocket操作実行ユーティリティ
export async function executeUIOperationViaWebSocket(operation: UIOperation): Promise<boolean> {
  try {
    // Socket.IO経由でのHTTP POST試行
    const operationRequest = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ui_operation',
        operation: operation.type,
        payload: operation.payload,
        description: operation.description,
        source: 'agents_api',
        timestamp: new Date().toISOString()
      })
    };
    
    console.log('🎯→🖥️ エージェント→Socket.IO UI操作:', operation.description);
    
    const response = await fetch('http://127.0.0.1:8080/ui-operation', operationRequest);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ UI操作送信成功:', operation.description, result);
      return true;
    } else {
      const errorData = await response.json();
      console.log('⚠️ UI操作送信失敗:', response.status, operation.description, errorData);
      return false;
    }
    
  } catch (error) {
    console.log('⚠️ Socket.IO UI操作実行エラー:', error);
    
    // フォールバック: 元のWebSocket実装は削除
    return false;
  }
}

// 自然言語レスポンス生成
export function generateNaturalResponse(userMessage: string, executedOperations: UIOperation[]): string {
  if (executedOperations.length === 0) {
    return `「${userMessage}」について理解できませんでした。銘柄変更（ETH、BTC等）、タイムフレーム変更（1h、4h、1d等）、テーマ変更（ダーク、ライト）などの操作に対応しています。`;
  }
  
  const operationDescriptions = executedOperations.map(op => op.description).join('、');
  
  if (executedOperations.length === 1) {
    return `✅ 実行完了: ${operationDescriptions}を行いました。チャートの表示が更新されているかご確認ください。`;
  } else {
    return `✅ ${executedOperations.length}つの操作を実行完了: ${operationDescriptions}。すべての変更がチャートに反映されているかご確認ください。`;
  }
}

// パラメータ抽出ユーティリティ（オーケストレーターより移行）
export function extractParameters(message: string, context?: any): Record<string, any> {
  const params: Record<string, any> = {};
  
  // シンボル抽出
  const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'MATIC'];
  for (const symbol of symbols) {
    if (message.toUpperCase().includes(symbol)) {
      params.symbol = `${symbol}USDT`;
      break;
    }
  }
  
  // タイムフレーム抽出
  if (message.includes('1分')) params.timeframe = '1m';
  if (message.includes('5分')) params.timeframe = '5m';
  if (message.includes('15分')) params.timeframe = '15m';
  if (message.includes('1時間')) params.timeframe = '1h';
  if (message.includes('4時間')) params.timeframe = '4h';
  if (message.includes('日足')) params.timeframe = '1d';
  
  // テーマ抽出
  if (message.includes('ダーク')) params.theme = 'dark';
  if (message.includes('ライト')) params.theme = 'light';
  
  return { ...params, ...context };
}

// パターンマッチングユーティリティ
export function matchesPattern(text: string, patterns: string[]): boolean {
  return patterns.some(pattern => text.includes(pattern));
}

// ログ出力ユーティリティ
export function logAgentActivity(
  source: string, 
  action: string, 
  details: any, 
  success: boolean = true
) {
  const emoji = success ? '✅' : '❌';
  const timestamp = new Date().toISOString();
  
  console.log(`${emoji} [${timestamp}] ${source}: ${action}`, details);
} 