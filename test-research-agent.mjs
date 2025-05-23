// test-research-agent.mjs
// researchAgentの直接テスト

async function testResearchAgent() {
  try {
    console.log('🔍 researchAgent直接テスト開始...');
    
    // TSファイルを動的インポート
    const { researchAgent } = await import('./src/mastra/agents/researchAgent.ts');
    console.log('✅ researchAgent インポート成功');
    
    console.log('📋 エージェント設定:', { 
      name: researchAgent.name, 
      toolCount: Object.keys(researchAgent.tools).length,
      tools: Object.keys(researchAgent.tools)
    });
    
    // 実際のLLM呼び出しテスト
    console.log('🧪 実際のLLM呼び出しテスト開始...');
    const response = await researchAgent.generate([
      {
        role: 'user', 
        content: '暗号資産市場の最新トレンドについて調査してください'
      }
    ]);
    
    console.log('✅ LLM応答成功:');
    console.log(response.text?.substring(0, 300));
    console.log('🎉 researchAgent完全動作確認OK');
    
  } catch (error) {
    console.error('❌ researchAgentテストエラー:', error.message);
    console.error('スタック:', error.stack);
  }
}

testResearchAgent(); 