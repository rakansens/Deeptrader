import { NextRequest, NextResponse } from 'next/server';
import { unifiedOrchestratorAgent } from '@/mastra/agents/orchestratorAgent';

/**
 * Chat API (軽量版)
 * 新しい統合エージェントAPIを使用してHTTP_COMMONSエラーを回避
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { message, symbol, timeframe } = await req.json();
    
    console.log('💬 メインチャット - 統合エージェントAPI処理:', { message, symbol, timeframe });
    
    // 統合エージェントAPIに委任（自動フォールバック機能付き）
    const agentResponse = await fetch('http://localhost:3000/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        symbol,
        timeframe,
        strategy: 'auto' // 自動選択でMASTRA→Pureフォールバック
      })
    });

    if (agentResponse.ok) {
      const agentData = await agentResponse.json();
      
      console.log('🎯 統合エージェント応答:', agentData);
      
      return NextResponse.json({
        success: true,
        orchestrator: {
          targetAgent: 'unified',
          reasoning: `統合エージェントAPI経由で${agentData.mode}モード実行`,
          action: 'unified_agent_delegation',
          mastraUsed: agentData.mode === 'mastra'
        },
        execution: {
          success: agentData.success,
          response: agentData.response || agentData.message,
          executedOperations: agentData.executedOperations,
          type: 'unified_agent_control'
        },
        response: agentData.response || agentData.message,
        timestamp: new Date().toISOString(),
        mode: `unified_${agentData.mode}_delegation`
      });
    } else {
      // 統合エージェントが失敗した場合のフォールバック
      console.log('⚠️ 統合エージェントエラー、UI操作エージェントにフォールバック');
      
      const fallbackResult = await executeUIOperation(message, { symbol, timeframe });
      
      return NextResponse.json({
        success: true,
        orchestrator: {
          targetAgent: 'ui',
          reasoning: '統合エージェント失敗によりUI操作エージェントにフォールバック',
          action: 'fallback_ui_operation',
          mastraUsed: false
        },
        execution: fallbackResult,
        response: fallbackResult?.response || 'フォールバック処理が完了しました',
        timestamp: new Date().toISOString(),
        mode: 'fallback_ui_operation'
      });
    }
    
  } catch (error) {
    console.error('❌ メインチャットAPIエラー:', error);
    
    return NextResponse.json({
      success: false,
      error: 'メインチャットAPIでエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// UI操作実行関数（レガシーフォールバック用）
async function executeUIOperation(message: string, parameters: any) {
  try {
    const response = await fetch('http://localhost:3000/api/agents/pure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, ...parameters })
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        response: data.message,
        executedOperations: data.executedOperations,
        type: 'ui_control'
      };
    }
  } catch (error) {
    console.log('⚠️ UI操作エラー:', error);
  }
  
  return {
    success: false,
    response: 'UI操作の実行に失敗しました',
    type: 'ui_control'
  };
}

// トレーディング分析実行関数
async function executeTradingAnalysis(message: string, parameters: any) {
  // 将来的にTrading Agentの実装
  return {
    success: true,
    response: `🔍 トレーディング分析: ${parameters.symbol || 'BTCUSDT'}の${parameters.timeframe || '1h'}チャートを分析中...（Trading Agent実装予定）`,
    analysis: {
      symbol: parameters.symbol || 'BTCUSDT',
      timeframe: parameters.timeframe || '1h',
      suggestion: '詳細な分析はTrading Agentの実装後に提供されます'
    },
    type: 'trading_analysis'
  };
}

// リサーチ実行関数
async function executeResearch(message: string, parameters: any) {
  // 将来的にResearch Agentの実装
  return {
    success: true,
    response: `📊 市場リサーチ: "${message}"に関する最新情報を収集中...（Research Agent実装予定）`,
    research: {
      query: message,
      status: 'pending_research_agent_implementation'
    },
    type: 'research'
  };
}

// バックテスト実行関数
async function executeBacktest(message: string, parameters: any) {
  // 将来的にBacktest Agentの実装
  return {
    success: true,
    response: `📈 バックテスト分析: 戦略検証を開始中...（Backtest Agent実装予定）`,
    backtest: {
      strategy: message,
      status: 'pending_backtest_agent_implementation'
    },
    type: 'backtest'
  };
}
