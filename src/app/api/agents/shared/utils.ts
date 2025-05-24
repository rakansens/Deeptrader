// src/app/api/agents/shared/utils.ts
// エージェント共通ユーティリティ - ロジック重複削除と再利用性向上
// undefinedメッセージの防御的処理追加でTypeErrorを回避
// Phase 6A-2: fetchWithTimeout統合によるAbortController重複解消
// Phase 6A-3: APIレスポンス生成統合 - 共通ライブラリ使用

import { UIOperation, AgentError } from './types';
import { fetchWithTimeout } from '@/lib/fetch';
import { isValidInput, hasText, isEmptyArray } from '@/lib/validation-utils';
import { parseSuccessResponse, parseErrorResponse } from '@/lib/async-utils';

// レスポンス生成は共通ライブラリを再エクスポート
export { 
  createSuccessResponse, 
  createErrorResponse,
  createSuccessNextResponse,
  createErrorNextResponse,
  type SuccessResponseData,
  type ErrorResponseData
} from '@/lib/api-response';

// 自然言語解析ユーティリティ（agent-pure.tsより移行・改善）
export function analyzeNaturalLanguageForUI(message: string): UIOperation[] {
  const operations: UIOperation[] = [];
  
  // メッセージの防御的チェック（統合バリデーション使用）
  if (!isValidInput(message)) {
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
    console.log('🎯→🖥️ エージェント→Socket.IO UI操作:', operation.description);
    
    try {
      const response = await fetchWithTimeout('http://127.0.0.1:8080/ui-operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ui_operation',
          operation: operation.type,
          payload: operation.payload,
          description: operation.description,
          source: 'agents_api',
          timestamp: new Date().toISOString()
        }),
        timeout: 5000 // 5秒タイムアウト
      });
      
      if (response.ok) {
        const result = await parseSuccessResponse(response);
        console.log('✅ UI操作送信成功:', operation.description, result);
        return true;
      } else {
        const errorData = await parseErrorResponse(response);
        console.log('⚠️ UI操作送信失敗:', response.status, operation.description, errorData);
        return false;
      }
    } catch (fetchError) {
      const errorInstance = fetchError as Error;
      if (errorInstance.message.includes('timed out')) {
        console.log('⚠️ Socket.IO UI操作タイムアウト:', operation.description);
      } else {
        console.log('⚠️ Socket.IO UI操作ネットワークエラー:', errorInstance.message);
      }
      throw fetchError;
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('⚠️ Socket.IO UI操作実行エラー:', errorMessage);
    
    // フォールバック: 操作は無効化（WebSocket直接接続は削除）
    console.log('📝 UI操作はログのみ記録 - WebSocketサーバーが利用できません');
    return false;
  }
}

// 自然言語レスポンス生成
export function generateNaturalResponse(userMessage: string, executedOperations: UIOperation[]): string {
  if (isEmptyArray(executedOperations)) {
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
  
  // メッセージの防御的チェック（統合バリデーション使用）
  if (!hasText(message)) {
    console.log('⚠️ extractParameters: 無効なメッセージ', { message, type: typeof message });
    return { ...context };
  }
  
  const upperMessage = message.toUpperCase();
  
  // シンボル抽出
  const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'MATIC'];
  for (const symbol of symbols) {
    if (upperMessage.includes(symbol)) {
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
  if (!text || typeof text !== 'string' || !patterns || !Array.isArray(patterns)) {
    return false;
  }
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