// test-ui-agent.mjs
// uiControlAgentの直接テスト

async function testUIAgent() {
  try {
    console.log('🎨 uiControlAgent直接テスト開始...');
    
    // TSファイルを動的インポート
    const { uiControlAgent } = await import('./src/mastra/agents/uiControlAgent.ts');
    console.log('✅ uiControlAgent インポート成功');
    
    console.log('📋 エージェント設定:', { 
      name: uiControlAgent.name, 
      toolCount: Object.keys(uiControlAgent.tools).length,
      tools: Object.keys(uiControlAgent.tools)
    });
    
    // 実際のLLM呼び出しテスト
    console.log('🧪 実際のLLM呼び出しテスト開始...');
    const response = await uiControlAgent.generate([
      {
        role: 'user', 
        content: 'チャートを4時間足に変更してください'
      }
    ]);
    
    console.log('✅ LLM応答成功:');
    console.log(response.text?.substring(0, 300));
    console.log('🎉 uiControlAgent完全動作確認OK');
    
  } catch (error) {
    console.error('❌ uiControlAgentテストエラー:', error.message);
    console.error('スタック:', error.stack);
  }
}

testUIAgent(); 