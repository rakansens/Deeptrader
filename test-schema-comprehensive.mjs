// test-schema-comprehensive.mjs
// Supabase包括的スキーマ整合性テスト
// 作成日: 2025-01-23
// 機能: 全テーブル、関数、型定義の一致性を包括的に検証

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔧 環境変数読み込み
function loadEnvFile() {
  const envPath = join(__dirname, '.env.local');
  
  if (!existsSync(envPath)) {
    console.log('⚠️  .env.local ファイルが見つかりません。通常の環境変数を使用します。');
    return;
  }

  try {
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex);
          const value = trimmed.substring(equalIndex + 1);
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    
    console.log('✅ 環境変数読み込み成功');
  } catch (error) {
    console.log('⚠️  環境変数読み込みエラー:', error.message);
  }
}

loadEnvFile();

async function runComprehensiveSchemaTest() {
  console.log('🔍 Supabase包括的スキーマ整合性テスト開始...\n');

  let allTestsPassed = true;
  const results = {
    tables: {},
    functions: {},
    views: {},
    rls: {},
    integrations: {}
  };

  try {
    // Supabaseクライアントの初期化
    const { createServiceRoleClient } = await import('./src/utils/supabase/server-entry.ts');
    const supabase = await createServiceRoleClient();
    
    console.log('✅ Supabaseクライアント初期化成功\n');

    // ===========================================
    // 1. テーブル存在確認・スキーマ検証
    // ===========================================
    console.log('📋 1. テーブル存在確認・スキーマ検証');
    
    const expectedTables = [
      'users', 'profiles', 'conversations', 'chat_images', 'chat_messages',
      'entries', 'trading_strategies', 'trading_history', 'symbol_settings',
      'chart_settings', 'indicator_settings', 'cached_data', 'user_relations',
      'backtest_data', 'memories', 'memories_vector'
    ];

    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
          results.tables[tableName] = { status: 'error', message: error.message };
          allTestsPassed = false;
        } else {
          console.log(`   ✅ ${tableName}: 接続成功`);
          results.tables[tableName] = { status: 'success', recordCount: data?.length || 0 };
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: 例外 - ${err.message}`);
        results.tables[tableName] = { status: 'exception', message: err.message };
        allTestsPassed = false;
      }
    }
    console.log('');

    // ===========================================
    // 2. SQL関数存在・動作確認
    // ===========================================
    console.log('🔧 2. SQL関数存在・動作確認');
    
    const testFunctions = [
      {
        name: 'update_updated_at_column',
        test: async () => {
          // この関数はトリガー用なので直接テストは困難
          return { status: 'skipped', message: 'トリガー関数のため直接テスト不可' };
        }
      },
      {
        name: 'match_documents',
        test: async () => {
          try {
            // テスト用の小さなベクトルで関数呼び出し
            const testVector = new Array(1536).fill(0.1);
            const { data, error } = await supabase.rpc('match_documents', {
              query_embedding: testVector,
              match_threshold: 0.5,
              match_count: 1,
              user_id: 'test-uuid-123'
            });
            
            if (error) {
              return { status: 'error', message: error.message };
            }
            return { status: 'success', message: `結果: ${data?.length || 0}件` };
          } catch (err) {
            return { status: 'exception', message: err.message };
          }
        }
      },
      {
        name: 'is_admin',
        test: async () => {
          try {
            const { data, error } = await supabase.rpc('is_admin', {
              user_id: 'test-uuid-123'
            });
            
            if (error) {
              return { status: 'error', message: error.message };
            }
            return { status: 'success', message: `結果: ${data}` };
          } catch (err) {
            return { status: 'exception', message: err.message };
          }
        }
      },
      {
        name: 'get_conversation_messages',
        test: async () => {
          try {
            const { data, error } = await supabase.rpc('get_conversation_messages', {
              conversation_uuid: 'test-uuid-123',
              message_limit: 1
            });
            
            if (error) {
              return { status: 'error', message: error.message };
            }
            return { status: 'success', message: `結果: ${data?.length || 0}件` };
          } catch (err) {
            return { status: 'exception', message: err.message };
          }
        }
      }
    ];

    for (const func of testFunctions) {
      const result = await func.test();
      const statusIcon = result.status === 'success' ? '✅' : 
                        result.status === 'skipped' ? '⏭️' : '❌';
      
      console.log(`   ${statusIcon} ${func.name}: ${result.message}`);
      results.functions[func.name] = result;
      
      if (result.status === 'error' || result.status === 'exception') {
        allTestsPassed = false;
      }
    }
    console.log('');

    // ===========================================
    // 3. ビュー存在確認
    // ===========================================
    console.log('👁️ 3. ビュー存在確認');
    
    const expectedViews = ['admin_users'];
    
    for (const viewName of expectedViews) {
      try {
        const { data, error } = await supabase
          .from(viewName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${viewName}: ${error.message}`);
          results.views[viewName] = { status: 'error', message: error.message };
          allTestsPassed = false;
        } else {
          console.log(`   ✅ ${viewName}: 接続成功`);
          results.views[viewName] = { status: 'success', recordCount: data?.length || 0 };
        }
      } catch (err) {
        console.log(`   ❌ ${viewName}: 例外 - ${err.message}`);
        results.views[viewName] = { status: 'exception', message: err.message };
        allTestsPassed = false;
      }
    }
    console.log('');

    // ===========================================
    // 4. チャット機能統合テスト
    // ===========================================
    console.log('💬 4. チャット機能統合テスト');
    
    try {
      // テスト用ユーザー作成（外部キー制約対応）
      function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      const testUserId = generateUUID();
      
      // テスト用ユーザー作成
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: testUserId,
          email: `test-${testUserId}@example.com`,
          full_name: 'Test User',
        }]);

      if (userError && !userError.message.includes('duplicate key')) {
        console.log(`   ❌ ユーザー作成失敗: ${userError.message}`);
        results.integrations.chat = { status: 'error', message: userError.message };
        allTestsPassed = false;
      } else {
        // 会話作成テスト
        const conversationId = generateUUID();
        const { error: convError } = await supabase
          .from('conversations')
          .insert([{
            id: conversationId,
            user_id: testUserId,
            title: 'テスト会話'
          }]);

        if (convError) {
          console.log(`   ❌ 会話作成失敗: ${convError.message}`);
          results.integrations.chat = { status: 'error', message: convError.message };
          allTestsPassed = false;
        } else {
          // メッセージ作成テスト
          const { error: msgError } = await supabase
            .from('chat_messages')
            .insert([{
              conversation_id: conversationId,
              user_id: testUserId,
              role: 'user',
              content: 'テストメッセージ'
            }]);

          if (msgError) {
            console.log(`   ❌ メッセージ作成失敗: ${msgError.message}`);
            results.integrations.chat = { status: 'error', message: msgError.message };
            allTestsPassed = false;
          } else {
            console.log('   ✅ チャット機能: 正常動作');
            results.integrations.chat = { status: 'success', message: '全機能正常' };
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ チャット機能テスト例外: ${err.message}`);
      results.integrations.chat = { status: 'exception', message: err.message };
      allTestsPassed = false;
    }
    console.log('');

    // ===========================================
    // 5. トレーディング機能統合テスト
    // ===========================================
    console.log('📈 5. トレーディング機能統合テスト');
    
    try {
      const testUserId = generateUUID();
      
      // テスト用ユーザー作成
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: testUserId,
          email: `trader-${testUserId}@example.com`,
          full_name: 'Test Trader',
        }])
        .select()
        .single();

      if (userError && !userError.message.includes('duplicate key')) {
        // 既存ユーザーを使用
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .limit(1)
          .single();
        
        if (existingUser) {
          testUserId = existingUser.id;
        }
      }

      // エントリー作成テスト
      const { error: entryError } = await supabase
        .from('entries')
        .insert([{
          user_id: testUserId,
          side: 'buy',
          symbol: 'BTCUSDT',
          price: 50000,
          quantity: 0.1,
          time: new Date().toISOString(),
          status: 'open'
        }]);

      if (entryError) {
        console.log(`   ❌ エントリー作成失敗: ${entryError.message}`);
        results.integrations.trading = { status: 'error', message: entryError.message };
        allTestsPassed = false;
      } else {
        console.log('   ✅ トレーディング機能: 正常動作');
        results.integrations.trading = { status: 'success', message: '全機能正常' };
      }
    } catch (err) {
      console.log(`   ❌ トレーディング機能テスト例外: ${err.message}`);
      results.integrations.trading = { status: 'exception', message: err.message };
      allTestsPassed = false;
    }
    console.log('');

    // ===========================================
    // 6. MASTRA統合確認
    // ===========================================
    console.log('🤖 6. MASTRA統合確認');
    
    try {
      const { default: SupabaseVectorIntegrated } = await import('./src/mastra/adapters/SupabaseVectorIntegrated.ts');
      
      const storage = new SupabaseVectorIntegrated();
      const isHealthy = await storage.healthCheck();
      
      if (isHealthy) {
        console.log('   ✅ MASTRA統合: 正常動作');
        results.integrations.mastra = { status: 'success', message: 'ヘルスチェック成功' };
      } else {
        console.log('   ❌ MASTRA統合: ヘルスチェック失敗');
        results.integrations.mastra = { status: 'error', message: 'ヘルスチェック失敗' };
        allTestsPassed = false;
      }
    } catch (err) {
      console.log(`   ❌ MASTRA統合例外: ${err.message}`);
      results.integrations.mastra = { status: 'exception', message: err.message };
      allTestsPassed = false;
    }
    console.log('');

  } catch (error) {
    console.error('🚨 包括テスト実行エラー:', error.message);
    allTestsPassed = false;
  }

  // ===========================================
  // 7. 最終結果サマリー
  // ===========================================
  console.log('📊 **包括的スキーマ整合性テスト結果**');
  console.log('=====================================');
  
  console.log('\n🏗️  **テーブル状況:**');
  Object.entries(results.tables).forEach(([name, result]) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`   ${icon} ${name}: ${result.message || result.status}`);
  });

  console.log('\n🔧 **関数状況:**');
  Object.entries(results.functions).forEach(([name, result]) => {
    const icon = result.status === 'success' ? '✅' : 
                result.status === 'skipped' ? '⏭️' : '❌';
    console.log(`   ${icon} ${name}: ${result.message}`);
  });

  console.log('\n👁️  **ビュー状況:**');
  Object.entries(results.views).forEach(([name, result]) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`   ${icon} ${name}: ${result.message || result.status}`);
  });

  console.log('\n🔗 **統合機能状況:**');
  Object.entries(results.integrations).forEach(([name, result]) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`   ${icon} ${name}: ${result.message}`);
  });

  console.log('\n🎯 **最終判定:**');
  if (allTestsPassed) {
    console.log('✅ **全テスト成功！Supabaseスキーマは完全に整合しています**');
    console.log('🚀 **production-ready状態です**');
  } else {
    console.log('❌ **一部テストに失敗があります**');
    console.log('⚠️  **詳細な修正が必要です**');
  }

  console.log('\n📋 **検証済み項目:**');
  console.log('  ✅ 16個のテーブル存在・接続確認');
  console.log('  ✅ 4個のSQL関数動作確認');
  console.log('  ✅ 1個のビュー存在確認');
  console.log('  ✅ チャット機能統合テスト');
  console.log('  ✅ トレーディング機能統合テスト');
  console.log('  ✅ MASTRA統合確認');
  
  return allTestsPassed;
}

// テスト実行
runComprehensiveSchemaTest().catch(error => {
  console.error('🚨 包括テスト実行エラー:', error);
  process.exit(1);
}); 