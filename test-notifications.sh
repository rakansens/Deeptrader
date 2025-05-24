#!/bin/bash
# 🧪 通知システムテスト監視スクリプト
# 通知の作成・更新・削除をリアルタイムで確認

echo "🎯 通知システム監視開始..."
echo "📍 ブラウザで http://localhost:3001 を開いてください"
echo "🔔 ヘッダーの通知ベルアイコンをクリックして「テスト」ボタンを押してください"
echo "======================================="

while true; do
  echo -e "\n⏰ $(date '+%H:%M:%S') - 現在の通知:"
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    SELECT 
      title,
      type,
      priority,
      CASE WHEN is_read THEN '✅' ELSE '❌' END as read_status,
      CASE WHEN is_dismissed THEN '🗑️' ELSE '📌' END as status,
      to_char(created_at, 'HH24:MI:SS') as created_time
    FROM notifications 
    ORDER BY created_at DESC 
    LIMIT 5;
  " 2>/dev/null
  
  echo -e "\n📊 通知統計:"
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    SELECT 
      COUNT(*) as total_notifications,
      COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
      COUNT(CASE WHEN is_dismissed = true THEN 1 END) as dismissed_count,
      COUNT(CASE WHEN priority >= 4 THEN 1 END) as high_priority_count
    FROM notifications;
  " 2>/dev/null
  
  sleep 3
done 