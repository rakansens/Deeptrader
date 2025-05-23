import { NextRequest, NextResponse } from 'next/server';
import { unifiedOrchestratorAgent } from '@/mastra/agents/orchestratorAgent';

/**
 * Chat API (軽量版)
 * MASTRAエージェントは/api/agentで実行し、_http_commonエラーを回避
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { message, symbol, timeframe } = await req.json();
    
    console.log('💬 メインチャット - 統合オーケストレーター処理:', { message, symbol, timeframe });
    
    // 統合オーケストレーターエージェントで意図分析・委任判断
    const orchestratorResponse = await unifiedOrchestratorAgent.analyzeAndDelegate(message, {
      symbol,
      timeframe,
    });
    
    console.log('🎯 オーケストレーター委任結果:', orchestratorResponse);
    
    // 委任先エージェントに応じて実際の処理を実行
    let executionResult = null;
    
    switch (orchestratorResponse.targetAgent) {
      case 'ui':
        // UI操作エージェントAPIに委任
        executionResult = await executeUIOperation(message, orchestratorResponse.parameters);
        break;
        
      case 'trading':
        // Trading Agentに委任
        executionResult = await executeTradingAnalysis(message, orchestratorResponse.parameters);
        break;
        
      case 'research':
        // Research Agentに委任
        executionResult = await executeResearch(message, orchestratorResponse.parameters);
        break;
        
      case 'backtest':
        // Backtest Agentに委任
        executionResult = await executeBacktest(message, orchestratorResponse.parameters);
        break;
        
      default:
        // 一般的な回答
        executionResult = {
          success: true,
          response: orchestratorResponse.response,
          type: 'general'
        };
    }
    
    return NextResponse.json({
      success: true,
      orchestrator: {
        targetAgent: orchestratorResponse.targetAgent,
        reasoning: orchestratorResponse.reasoning,
        action: orchestratorResponse.action,
        mastraUsed: orchestratorResponse.mastraUsed
      },
      execution: executionResult,
      response: executionResult?.response || orchestratorResponse.response,
      timestamp: new Date().toISOString(),
      mode: orchestratorResponse.mastraUsed ? 'mastra_orchestrator_with_delegation' : 'fallback_orchestrator_with_delegation'
    });
    
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

// UI操作実行関数
async function executeUIOperation(message: string, parameters: any) {
  try {
    const response = await fetch('http://localhost:3000/api/agent-pure', {
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
