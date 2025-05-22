#!/bin/bash
# deploy_pgvector.sh - Supabase + pgvector の設定とデプロイ

set -e  # エラーが発生したら終了

echo "🔍 Supabase + pgvector デプロイスクリプト"
echo "----------------------------------------"

# 環境変数を確認
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "❌ 環境変数 SUPABASE_URL または SUPABASE_KEY が設定されていません"
  echo "  以下を.envファイルに設定するか、直接エクスポートしてください："
  echo "  export SUPABASE_URL='https://xxx.supabase.co'"
  echo "  export SUPABASE_KEY='your-service-role-key'"
  exit 1
fi

# 新しいマイグレーションファイルが存在するか確認
if [ -f "supabase/migrations/20240522_003_vector_extension.sql" ] && [ -f "supabase/migrations/20240522_008_chat_images_rls.sql" ]; then
  echo "✅ マイグレーションファイルを確認しました"
else
  echo "❌ マイグレーションファイルが見つかりません"
  exit 1
fi

# SupabaseVector アダプタが存在するか確認
if [ -f "src/mastra/adapters/SupabaseVector.ts" ]; then
  echo "✅ SupabaseVector アダプタを確認しました"
else
  echo "❌ SupabaseVector アダプタが見つかりません"
  exit 1
fi

# マイグレーションの実行（ローカル開発環境の場合）
if [ "$1" = "local" ]; then
  echo "🔄 ローカルSupabaseでマイグレーションを実行中..."
  npx supabase migration up --db-url $SUPABASE_URL
else
  # Supabaseへの直接SQLマイグレーション実行
  echo "🔄 Supabaseでマイグレーションを実行中..."
  cat supabase/migrations/20240522_003_vector_extension.sql | psql $SUPABASE_URL
  cat supabase/migrations/20240522_008_chat_images_rls.sql | psql $SUPABASE_URL
  echo "✅ マイグレーション完了"
fi

# テーブル作成確認
echo "🔍 memories_vector テーブルを確認中..."
TABLES=$(psql -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memories_vector';" $SUPABASE_URL)

if [[ $TABLES == *"memories_vector"* ]]; then
  echo "✅ memories_vector テーブルが存在します"
else
  echo "❌ memories_vector テーブルが作成されていません"
  exit 1
fi

# 最終確認
echo "🔍 match_documents 関数を確認中..."
FUNCTIONS=$(psql -t -c "SELECT proname FROM pg_proc WHERE proname = 'match_documents';" $SUPABASE_URL)

if [[ $FUNCTIONS == *"match_documents"* ]]; then
  echo "✅ match_documents 関数が存在します"
else
  echo "❌ match_documents 関数が作成されていません"
  exit 1
fi

echo "✅ Supabase + pgvector の設定が完了しました"
echo ""
echo "次のステップ:"
echo "1. アプリケーションを再起動してください: npm run dev"
echo "2. チャットページ(/chat)で動作確認してください"
echo "3. RAGが正常に動作するか確認してください"
echo ""
echo "問題がある場合は以下を確認してください:"
echo "- Supabaseコンソールでテーブルとポリシーの設定"
echo "- Mastraのバージョンと互換性"
echo "- next.config.jsの設定"
echo ""
echo "完了🎉" 