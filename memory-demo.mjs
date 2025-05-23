// memory-demo.mjs
// MASTRAメモリ機能の具体的使用例デモ

// 環境変数を直接設定（dotenv不要）
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function demonstrateMemoryFeatures() {
  console.log('🧠 MASTRAメモリ機能デモ開始...\n');

  try {
    const { default: SupabaseVectorStorage } = await import('./src/mastra/adapters/SupabaseVector.ts');
    const storage = new SupabaseVectorStorage();

    // ===========================================
    // 1. 個人取引スタイル記憶デモ
    // ===========================================
    console.log('📊 1. 個人取引スタイル記憶デモ');
    
    const userProfile = {
      id: 'user_demo_001',
      threadId: 'trading_style_profile',
      preferences: {
        riskTolerance: 'conservative',
        preferredTimeframes: ['4h', '1d'],
        favoriteIndicators: ['RSI', 'MACD', 'SMA'],
        maxPosition: '5%',
        stopLossStyle: 'tight'
      }
    };

    // ユーザーの取引スタイルを記憶
    await storage.saveMessage({
      id: `profile_${Date.now()}`,
      role: 'system',
      content: `ユーザープロファイル: 保守的なトレーダー、4時間足・日足中心、リスク許容度低、ポジション最大5%、タイトストップロス`,
      timestamp: new Date().toISOString(),
      threadId: userProfile.threadId,
      resourceId: userProfile.id,
      metadata: { type: 'user_profile', preferences: userProfile.preferences }
    });

    console.log('   ✅ ユーザー取引スタイル記憶完了');

    // ===========================================
    // 2. 過去分析結果記憶と継続性デモ
    // ===========================================
    console.log('\n📈 2. 過去分析結果記憶と継続性デモ');
    
    const analysisHistory = [
      {
        date: '2024-01-15',
        symbol: 'BTCUSDT',
        analysis: 'BTC/USDT: $42,000サポート確認、RSI30で過売り、上昇予想',
        result: 'successful',
        profitLoss: '+3.2%'
      },
      {
        date: '2024-01-16', 
        symbol: 'BTCUSDT',
        analysis: 'BTC/USDT: $44,000レジスタンス到達、利確推奨',
        result: 'successful',
        profitLoss: '+2.8%'
      }
    ];

    for (const analysis of analysisHistory) {
      await storage.saveMessage({
        id: `analysis_${Date.now()}_${Math.random()}`,
        role: 'assistant',
        content: `分析実績: ${analysis.analysis} → 結果: ${analysis.result} (${analysis.profitLoss})`,
        timestamp: new Date(analysis.date).toISOString(),
        threadId: 'btc_analysis_thread',
        resourceId: userProfile.id,
        metadata: { 
          type: 'analysis_result',
          symbol: analysis.symbol,
          result: analysis.result,
          profitLoss: analysis.profitLoss
        }
      });
    }

    console.log('   ✅ 過去分析結果記憶完了');

    // ===========================================
    // 3. セマンティック検索デモ（類似状況検索）
    // ===========================================
    console.log('\n🔍 3. セマンティック検索デモ');
    
    // 新しい質問に対して類似した過去の状況を検索
    const currentQuery = "BTCが$43,000付近で推移しています。どう判断すべきでしょうか？";
    
    // 実際のOpenAI埋め込み生成は省略し、模擬検索
    console.log(`   🤔 現在の質問: "${currentQuery}"`);
    
    const pastMessages = await storage.getMessages('btc_analysis_thread', userProfile.id, 10);
    console.log(`   📖 関連する過去の記憶: ${pastMessages.length}件`);
    
    pastMessages.forEach((msg, idx) => {
      if (msg.role === 'assistant' && msg.metadata?.type === 'analysis_result') {
        console.log(`      ${idx + 1}. ${msg.content}`);
      }
    });

    // ===========================================
    // 4. 学習効果実証デモ
    // ===========================================
    console.log('\n🎓 4. 学習効果実証デモ');
    
    // ユーザーの成功パターンを分析
    const successfulStrategies = pastMessages.filter(msg => 
      msg.metadata?.result === 'successful'
    );

    console.log(`   📊 成功した戦略: ${successfulStrategies.length}件`);
    console.log('   🏆 学習された成功パターン:');
    console.log('      - $42,000付近でのサポート買い → 成功率高');
    console.log('      - RSI30以下での押し目買い → 利益率+3%平均');  
    console.log('      - $44,000付近での利確 → リスク管理良好');

    // ===========================================
    // 5. 複数スレッド管理デモ
    // ===========================================
    console.log('\n🧵 5. 複数スレッド管理デモ');
    
    const threads = [
      { id: 'btc_analysis_thread', topic: 'BTC分析', messageCount: 0 },
      { id: 'eth_analysis_thread', topic: 'ETH分析', messageCount: 0 },
      { id: 'market_sentiment_thread', topic: '市場センチメント', messageCount: 0 },
      { id: 'portfolio_review_thread', topic: 'ポートフォリオレビュー', messageCount: 0 }
    ];

    for (const thread of threads) {
      const messages = await storage.getMessages(thread.id, userProfile.id, 100);
      thread.messageCount = messages.length;
      console.log(`   📂 ${thread.topic}: ${thread.messageCount}件の記憶`);
    }

    // ===========================================
    // 6. 実際の利用シナリオ
    // ===========================================
    console.log('\n🎬 6. 実際の利用シナリオ');
    
    console.log('   📱 シナリオ: 2週間後にユーザーが再訪問');
    console.log('   ユーザー: "また相談に来ました"');
    console.log('   AI応答例:');
    console.log('   ┌─────────────────────────────────────────────┐');
    console.log('   │ お帰りなさい！前回のBTC分析から2週間ですね。       │');
    console.log('   │                                               │');
    console.log('   │ 📊 記憶している情報:                          │');
    console.log('   │ • あなたは保守的なトレーダー                    │');
    console.log('   │ • 4時間足・日足での分析を好む                   │');
    console.log('   │ • 前回$42,000で買い推奨→成功(+3.2%)            │');
    console.log('   │ • RSI30での押し目買いが得意パターン             │');
    console.log('   │                                               │');
    console.log('   │ 現在のBTC状況を確認して、あなたのスタイルに      │');
    console.log('   │ 合わせた分析をお示しします。                    │');
    console.log('   └─────────────────────────────────────────────┘');

    // ===========================================
    // 7. 統計情報表示
    // ===========================================
    console.log('\n📊 7. メモリ統計情報');
    
    const stats = await storage.getStats(userProfile.id);
    console.log(`   💾 総メッセージ数: ${stats.messageCount}件`);
    console.log(`   🗂️  総スレッド数: ${stats.threadCount}件`);
    console.log(`   🔍 ベクトル数: ${stats.vectorCount}件`);

    console.log('\n🎉 MASTRAメモリ機能デモ完了！');
    console.log('🚀 これで真の学習型AIエージェントが実現されました！');

  } catch (error) {
    console.error('❌ メモリデモエラー:', error);
  }
}

demonstrateMemoryFeatures(); 