#!/bin/bash
# 🧪 設定テスト監視スクリプト
# 設定変更をリアルタイムで確認

echo "🎯 音声設定監視開始..."
echo "📍 ブラウザで http://localhost:3000 を開いて設定を変更してください"
echo "======================================="

while true; do
  echo -e "\n⏰ $(date '+%H:%M:%S') - 現在の音声設定:"
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    SELECT 
      preference_key, 
      preference_value, 
      to_char(updated_at, 'HH24:MI:SS') as updated_time
    FROM user_preferences 
    WHERE category = 'audio' 
    ORDER BY preference_key;
  " 2>/dev/null
  
  sleep 3
done 