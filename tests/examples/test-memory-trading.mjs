// test-memory-trading.mjs
// メモリ機能を活用したtradingAgentの動作テスト

async function testMemoryTradingAgent() {
  console.log('🧠 メモリ機能付きtradingAgentテスト開始...\n');

  try {
    // 1. メモリ機能確認
    console.log('📦 1. tradingAgentメモリ機能確認');
    const { tradingAgent } = await import('./src/mastra/agents/tradingAgent.ts');
    
    console.log(`✅ エージェント名: ${tradingAgent.name}`);
    console.log(`✅ ツール数: ${Object.keys(tradingAgent.tools).length}`);
    
    // メモリ機能の確認
    const hasMemory = tradingAgent.getMemory();
    console.log(`✅ メモリ機能: ${hasMemory ? '有効' : '無効'}`);
    
    if (!hasMemory) {
      console.log('⚠️  メモリ機能が無効です。設定を確認してください。');
      return;
    }

    // 2. 継続的会話テスト
    console.log('\n💬 2. 継続的会話テスト');
    
    // 最初の質問
    console.log('   👤 質問1: "BTCの現在の状況を教えてください"');
    const response1 = await tradingAgent.generate([
      {
        role: 'user',
        content: 'BTCの現在の状況を教えてください。リスク許容度は低めで、4時間足での分析を好みます。'
      }
    ]);
    
    console.log(`   🤖 応答1: ${response1.text?.substring(0, 200)}...`);
    
    // 少し時間をおいて関連質問
    console.log('\n   👤 質問2: "前回の分析を踏まえて、追加のアドバイスはありますか？"');
    const response2 = await tradingAgent.generate([
      {
        role: 'user',
        content: '前回の分析を踏まえて、追加のアドバイスはありますか？私の取引スタイルに合った戦略を教えてください。'
      }
    ]);
    
    console.log(`   🤖 応答2: ${response2.text?.substring(0, 200)}...`);

    // 3. メモリ活用の確認
    console.log('\n🔍 3. メモリ活用度確認');
    
    // 応答にコンテキストが含まれているかチェック
    const memoryIndicators = [
      '前回', '以前', 'あなたの', 'スタイル', '4時間足', 'リスク許容度', '保守的'
    ];
    
    const response2Lower = response2.text?.toLowerCase() || '';
    const memoryUsage = memoryIndicators.filter(indicator => 
      response2Lower.includes(indicator.toLowerCase())
    );
    
    console.log(`   📊 メモリ活用指標検出: ${memoryUsage.length}/${memoryIndicators.length}`);
    console.log(`   🎯 検出キーワード: ${memoryUsage.join(', ')}`);
    
    if (memoryUsage.length >= 2) {
      console.log('   ✅ メモリ機能が正常に動作しています！');
    } else {
      console.log('   ⚠️  メモリ機能の活用度が低い可能性があります。');
    }

    // 4. スレッド管理テスト
    console.log('\n🧵 4. スレッド管理テスト');
    
    // 異なるトピックで質問
    console.log('   👤 質問3: "ETHについても分析をお願いします"');
    const response3 = await tradingAgent.generate([
      {
        role: 'user',
        content: 'ETHについても分析をお願いします。BTCとは別の戦略で考えたいです。'
      }
    ]);
    
    console.log(`   🤖 応答3: ${response3.text?.substring(0, 200)}...`);
    
    // BTCに戻る
    console.log('\n   👤 質問4: "BTCの話に戻りますが、エントリータイミングはどうでしょうか？"');
    const response4 = await tradingAgent.generate([
      {
        role: 'user',
        content: 'BTCの話に戻りますが、エントリータイミングはどうでしょうか？最初の分析から状況は変わりましたか？'
      }
    ]);
    
    console.log(`   🤖 応答4: ${response4.text?.substring(0, 200)}...`);

    // 5. 学習効果確認
    console.log('\n🎓 5. 学習効果確認');
    
    const allResponses = [response1.text, response2.text, response3.text, response4.text];
    const consistencyChecks = {
      userPreferences: 0,  // ユーザー設定の言及
      contextContinuity: 0, // 文脈の継続性
      personalizedAdvice: 0 // 個別化されたアドバイス
    };
    
    allResponses.forEach((response, index) => {
      if (!response) return;
      
      const text = response.toLowerCase();
      
      // ユーザー設定の言及をチェック
      if (text.includes('4時間') || text.includes('リスク') || text.includes('保守的')) {
        consistencyChecks.userPreferences++;
      }
      
      // 文脈の継続性をチェック
      if (index > 0 && (text.includes('前回') || text.includes('先ほど') || text.includes('以前'))) {
        consistencyChecks.contextContinuity++;
      }
      
      // 個別化されたアドバイスをチェック
      if (text.includes('あなたの') || text.includes('あなたに') || text.includes('お客様の')) {
        consistencyChecks.personalizedAdvice++;
      }
    });
    
    console.log('   📈 学習効果スコア:');
    console.log(`      ユーザー設定記憶: ${consistencyChecks.userPreferences}/4`);
    console.log(`      文脈継続性: ${consistencyChecks.contextContinuity}/3`);
    console.log(`      個別化度: ${consistencyChecks.personalizedAdvice}/4`);
    
    const totalScore = Object.values(consistencyChecks).reduce((a, b) => a + b, 0);
    const maxScore = 11;
    const scorePercentage = Math.round((totalScore / maxScore) * 100);
    
    console.log(`   🎯 総合メモリ活用度: ${scorePercentage}%`);

    // 6. 結果評価
    console.log('\n📊 6. テスト結果評価');
    
    if (scorePercentage >= 70) {
      console.log('   🎉 優秀！ メモリ機能が効果的に動作しています');
      console.log('   ✨ 真の学習型AIエージェントとして機能中');
    } else if (scorePercentage >= 50) {
      console.log('   👍 良好！ メモリ機能が基本的に動作しています');
      console.log('   🔧 さらなる最適化で改善可能');
    } else {
      console.log('   ⚠️  改善が必要！ メモリ機能の設定を確認してください');
      console.log('   🛠️  SupabaseVectorStorage設定の見直しを推奨');
    }

    console.log('\n🎊 メモリ機能付きtradingAgentテスト完了！');

  } catch (error) {
    console.error('❌ テストエラー:', error.message);
    console.error('スタック:', error.stack);
  }
}

testMemoryTradingAgent(); 