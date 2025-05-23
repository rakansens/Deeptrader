// test-trading-agent.mjs
// tradingAgentの直接テスト

async function testTradingAgent() {
  try {
    console.log('🤖 tradingAgent直接テスト開始...');
    
    // TSファイルを動的インポート
    const { tradingAgent } = await import('./src/mastra/agents/tradingAgent.ts');
    console.log('✅ tradingAgent インポート成功');
    
    console.log('📋 エージェント設定:', { 
      name: tradingAgent.name, 
      toolCount: Object.keys(tradingAgent.tools).length,
      tools: Object.keys(tradingAgent.tools)
    });
    
    // 実際のLLM呼び出しテスト
    console.log('🧪 実際のLLM呼び出しテスト開始...');
    const response = await tradingAgent.generate([
      {
        role: 'user', 
        content: 'BTCUSDTの現在の市場状況について簡潔に分析してください'
      }
    ]);
    
    console.log('✅ LLM応答成功:');
    console.log(response.text?.substring(0, 300));
    console.log('🎉 tradingAgent完全動作確認OK');
    
  } catch (error) {
    console.error('❌ tradingAgentテストエラー:', error.message);
    console.error('スタック:', error.stack);
  }
}

testTradingAgent(); 