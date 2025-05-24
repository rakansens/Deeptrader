// test-backtest-agent.mjs
// backtestAgentの直接テスト

async function testBacktestAgent() {
  try {
    console.log('📊 backtestAgent直接テスト開始...');
    
    // TSファイルを動的インポート
    const { backtestAgent } = await import('./src/mastra/agents/backtestAgent.ts');
    console.log('✅ backtestAgent インポート成功');
    
    console.log('📋 エージェント設定:', { 
      name: backtestAgent.name, 
      toolCount: Object.keys(backtestAgent.tools).length,
      tools: Object.keys(backtestAgent.tools)
    });
    
    // 実際のLLM呼び出しテスト
    console.log('🧪 実際のLLM呼び出しテスト開始...');
    const response = await backtestAgent.generate([
      {
        role: 'user', 
        content: '移動平均クロス戦略のバックテストを実行してください'
      }
    ]);
    
    console.log('✅ LLM応答成功:');
    console.log(response.text?.substring(0, 300));
    console.log('🎉 backtestAgent完全動作確認OK');
    
  } catch (error) {
    console.error('❌ backtestAgentテストエラー:', error.message);
    console.error('スタック:', error.stack);
  }
}

testBacktestAgent(); 