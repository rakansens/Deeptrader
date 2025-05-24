#!/bin/bash
# 🧪 アバターアップロードテスト監視スクリプト
# アバター設定変更をリアルタイムで確認

echo "🎯 アバター設定監視開始..."
echo "📍 ブラウザで http://localhost:3000 を開いて設定画面でアバター画像をアップロードしてください"
echo "======================================="

while true; do
  echo -e "\n⏰ $(date '+%H:%M:%S') - 現在のアップロードファイル:"
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    SELECT 
      file_type, 
      original_name,
      file_size,
      to_char(created_at, 'HH24:MI:SS') as uploaded_time,
      CASE WHEN is_active THEN '✅' ELSE '❌' END as active
    FROM uploaded_files 
    ORDER BY created_at DESC;
  " 2>/dev/null
  
  echo -e "\n📊 アバター設定統計:"
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    SELECT 
      file_type,
      COUNT(*) as total_files,
      COUNT(CASE WHEN is_active THEN 1 END) as active_files,
      SUM(file_size) as total_size_bytes
    FROM uploaded_files 
    GROUP BY file_type
    ORDER BY file_type;
  " 2>/dev/null
  
  sleep 5
done 