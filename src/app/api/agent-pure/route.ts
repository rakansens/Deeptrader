// src/app/api/agent-pure/route.ts
// MASTRA完全回避、純粋WebSocket自然言語UIコントロールエージェント
import { NextRequest, NextResponse } from 'next/server';

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { message, symbol, timeframe } = await req.json();
    
    console.log('🎯 純粋UIコントロールエージェント - 受信:', { message, symbol, timeframe });
    
    // 段階1: 高度な自然言語解析
    const uiOperations = analyzeNaturalLanguageForUI(message);
    
    // 段階2: WebSocket経由でリアルタイムUI操作
    const executedOperations = [];
    for (const operation of uiOperations) {
      const success = await executeUIOperationViaWebSocket(operation);
      if (success) {
        executedOperations.push(operation);
      }
    }
    
    // 段階3: 自然言語レスポンス生成
    const response = generateNaturalResponse(message, executedOperations);
    
    return NextResponse.json({
      success: true,
      message: response,
      executedOperations: executedOperations,
      totalOperations: uiOperations.length,
      timestamp: new Date().toISOString(),
      mode: 'pure_websocket_ui_control',
      agent: 'natural_language_ui_controller'
    });
    
  } catch (error) {
    console.error('❌ Pure UI Agent Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: '純粋UIコントロールエージェントでエラーが発生しました',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// 高度な自然言語解析（複数の操作を検出）
function analyzeNaturalLanguageForUI(message: string): UIOperation[] {
  const operations: UIOperation[] = [];
  const lowerMessage = message.toLowerCase();
  
  // 銘柄変更の検出（より多くのパターン）
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
      break; // 最初にマッチしたもののみ
    }
  }
  
  // タイムフレーム変更の検出（より柔軟なパターン）
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

// WebSocket経由でUI操作を実行
async function executeUIOperationViaWebSocket(operation: UIOperation): Promise<boolean> {
  try {
    // Socket.IOクライアントでの接続（HTTP requestで代替）
    const operationRequest = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ui_operation',
        operation: operation.type,
        payload: operation.payload,
        description: operation.description,
        source: 'pure_natural_language_agent',
        timestamp: new Date().toISOString()
      })
    };
    
    console.log('🎯→🖥️ 純粋エージェント→Socket.IO UI操作:', operation.description);
    
    // Socket.IOサーバーにHTTP POST経由で操作を送信
    const response = await fetch('http://127.0.0.1:8080/ui-operation', operationRequest);
    
    if (response.ok) {
      console.log('✅ UI操作送信成功:', operation.description);
      return true;
    } else {
      console.log('⚠️ UI操作送信失敗:', response.status, operation.description);
      return false;
    }
    
  } catch (error) {
    console.log('⚠️ Socket.IO UI操作実行エラー:', error);
    
    // フォールバック: WebSocket直接接続を試行
    try {
      const { default: WebSocket } = await import('ws');
      
      const ws = new WebSocket('ws://127.0.0.1:8080');
      
      return new Promise<boolean>((resolve) => {
        ws.on('open', () => {
          const command = {
            id: `pure_${Date.now()}`,
            type: 'ui_operation',
            operation: operation.type,
            payload: operation.payload,
            timestamp: new Date().toISOString(),
            source: 'pure_natural_language_agent',
            description: operation.description
          };
          
          console.log('🔄 フォールバック WebSocket UI操作:', operation.description);
          ws.send(JSON.stringify(command));
          
          setTimeout(() => {
            ws.close();
            resolve(true);
          }, 500);
        });
        
        ws.on('error', (error) => {
          console.log('⚠️ フォールバック WebSocket エラー:', error.message);
          resolve(false);
        });
      });
      
    } catch (fallbackError) {
      console.log('⚠️ フォールバック WebSocket実行エラー:', fallbackError);
      return false;
    }
  }
}

// 自然言語レスポンス生成
function generateNaturalResponse(userMessage: string, executedOperations: UIOperation[]): string {
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

// UI操作の型定義
interface UIOperation {
  type: 'change_symbol' | 'change_timeframe' | 'change_theme' | 'toggle_indicator';
  payload: any;
  description: string;
} 