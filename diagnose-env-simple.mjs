// diagnose-env-simple.mjs
// 環境変数詳細診断スクリプト（依存関係なし版）
// 作成日: 2025-01-23

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 環境変数詳細診断開始...\n');

// .env.local ファイルを手動で読み込み
const envPath = join(__dirname, '.env.local');

if (!existsSync(envPath)) {
  console.log('❌ .env.local ファイルが見つかりません');
  console.log(`📁 期待するパス: ${envPath}`);
  process.exit(1);
}

try {
  const envContent = readFileSync(envPath, 'utf8');
  console.log('✅ .env.local ファイル読み込み成功');
  console.log(`📁 ファイルパス: ${envPath}`);
  
  // 環境変数を手動でパース
  const envVars = {};
  const lines = envContent.split('\n');
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex);
        const value = trimmed.substring(equalIndex + 1);
        envVars[key] = value;
      }
    }
  });
  
  console.log(`📝 解析された環境変数: ${Object.keys(envVars).length} 個\n`);
  
  // 必須環境変数のリスト
  const requiredEnvVars = {
    'NEXT_PUBLIC_SUPABASE_URL': 'Supabase プロジェクト URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase 匿名キー',
    'SUPABASE_SERVICE_ROLE_KEY': 'Supabase サービスロールキー',
    'HUB_JWT_SECRET': 'JWT 秘密鍵',
  };

  const optionalEnvVars = {
    'OPENAI_API_KEY': 'OpenAI API キー（LLM機能用）',
    'AI_MODEL': 'AI モデル名',
    'BINANCE_BASE_URL': 'Binance API URL',
    'REDIS_URL': 'Redis 接続URL',
  };

  console.log('📋 **必須環境変数チェック**');
  console.log('================================');

  let allRequiredPresent = true;
  let foundVars = 0;
  let missingVars = [];

  for (const [key, description] of Object.entries(requiredEnvVars)) {
    const value = envVars[key] || process.env[key];
    const status = value ? '✅' : '❌';
    const displayValue = value ? 
      (value.length > 20 ? `${value.substring(0, 15)}...` : value) : 
      '未設定';
    
    console.log(`${status} ${key}: ${displayValue}`);
    console.log(`   📝 ${description}`);
    
    if (value) {
      foundVars++;
    } else {
      allRequiredPresent = false;
      missingVars.push(key);
    }
    console.log('');
  }

  console.log('📊 **オプション環境変数チェック**');
  console.log('================================');

  for (const [key, description] of Object.entries(optionalEnvVars)) {
    const value = envVars[key] || process.env[key];
    const status = value ? '✅' : '⚠️ ';
    const displayValue = value ? 
      (value.length > 20 ? `${value.substring(0, 15)}...` : value) : 
      '未設定（デフォルト値使用）';
    
    console.log(`${status} ${key}: ${displayValue}`);
    console.log(`   📝 ${description}`);
    console.log('');
  }

  console.log('📈 **診断結果サマリー**');
  console.log('========================');
  console.log(`必須環境変数: ${foundVars}/${Object.keys(requiredEnvVars).length} 設定済み`);
  console.log(`オプション環境変数: ${Object.keys(optionalEnvVars).filter(key => envVars[key] || process.env[key]).length}/${Object.keys(optionalEnvVars).length} 設定済み`);

  if (allRequiredPresent) {
    console.log('✅ **すべての必須環境変数が設定されています！**');
    
    // Supabase接続テスト
    console.log('\n🔗 **Supabase接続テスト実行中...**');
    
    try {
      const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'] || process.env['NEXT_PUBLIC_SUPABASE_URL'];
      const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
      
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (testResponse.ok) {
        console.log('✅ Supabase 接続成功！');
      } else {
        console.log(`❌ Supabase 接続失敗: ${testResponse.status} ${testResponse.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Supabase 接続エラー: ${error.message}`);
    }
    
  } else {
    console.log('❌ **不足している必須環境変数があります**');
    console.log('\n🚨 **不足している環境変数:**');
    missingVars.forEach(varName => {
      console.log(`   ❌ ${varName}: ${requiredEnvVars[varName]}`);
    });
    
    console.log('\n💡 **解決方法:**');
    console.log('1. .env.local ファイルに以下の環境変数を追加してください:');
    missingVars.forEach(varName => {
      console.log(`   ${varName}=your-${varName.toLowerCase().replace(/_/g, '-')}-here`);
    });
    console.log('\n2. Supabase ダッシュボードから正しい値を取得してください');
    console.log('   🔗 https://supabase.com → プロジェクト設定 → API');
  }

  console.log('\n🔧 **次のステップ:**');
  if (allRequiredPresent) {
    console.log('✅ 環境変数設定完了！統合テストを実行できます:');
    console.log('   npx tsx test-supabase-integration.mjs');
  } else {
    console.log('⚠️  不足している環境変数を設定してから再テストしてください');
  }

  console.log('\n📊 **設定済み環境変数一覧:**');
  Object.keys(envVars).forEach(key => {
    const value = envVars[key];
    const maskedValue = value.length > 10 ? `${value.substring(0, 8)}...` : value;
    console.log(`   🔑 ${key}: ${maskedValue}`);
  });

} catch (error) {
  console.error('❌ .env.local ファイル読み込みエラー:', error.message);
  process.exit(1);
} 