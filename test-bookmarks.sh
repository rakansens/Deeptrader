#!/bin/bash
# 📚 ブックマーク機能（DB版）テスト監視スクリプト
# ブックマークの作成・更新・削除をリアルタイムで確認

echo "📚 ブックマーク機能監視開始..."
echo "📍 ブラウザで http://localhost:3001 を開いてください"
echo "🔖 チャットメッセージの「ブックマーク」ボタンをテストしてください"
echo "======================================="

while true; do
  echo -e "\n⏰ $(date '+%H:%M:%S') - 現在のブックマーク:"
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    SELECT 
      b.title,
      bc.name as category,
      CASE WHEN b.is_starred THEN '⭐' ELSE '📌' END as starred,
      b.message_role,
      to_char(b.created_at, 'HH24:MI:SS') as created_time
    FROM bookmarks b
    LEFT JOIN bookmark_categories bc ON b.category_id = bc.id
    ORDER BY b.created_at DESC 
    LIMIT 5;
  " 2>/dev/null
  
  echo -e "\n📊 ブックマーク統計:"
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    SELECT 
      COUNT(*) as total_bookmarks,
      COUNT(CASE WHEN is_starred = true THEN 1 END) as starred_count,
      COUNT(CASE WHEN message_role = 'user' THEN 1 END) as user_messages,
      COUNT(CASE WHEN message_role = 'assistant' THEN 1 END) as assistant_messages
    FROM bookmarks;
  " 2>/dev/null

  echo -e "\n🏷️ タグ統計:"
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    SELECT 
      bt.tag_name,
      COUNT(*) as usage_count
    FROM bookmark_tags bt
    GROUP BY bt.tag_name
    ORDER BY usage_count DESC
    LIMIT 5;
  " 2>/dev/null
  
  echo -e "\n📂 カテゴリ使用状況:"
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    SELECT 
      bc.name as category_name,
      COUNT(b.id) as bookmark_count
    FROM bookmark_categories bc
    LEFT JOIN bookmarks b ON bc.id = b.category_id
    GROUP BY bc.id, bc.name, bc.display_order
    ORDER BY bc.display_order;
  " 2>/dev/null
  
  sleep 3
done 