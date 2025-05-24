-- migrate:up
-- LocalStorageからDB専用への移行後のクリーンアップ
-- 作成日: 2025/6/1
-- 更新内容: ユーザーごとの会話・メッセージ数の確認と孤立データのクリーンアップ
-- 注意: このスクリプトは参照用です。削除操作は慎重に行ってください。

-- 1. 現在のユーザーと会話の状況を確認
SELECT 
  u.id as user_id,
  u.email,
  COUNT(DISTINCT c.id) as conversation_count,
  COUNT(DISTINCT cm.id) as message_count,
  MIN(c.created_at) as first_conversation,
  MAX(c.created_at) as last_conversation
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id
LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
GROUP BY u.id, u.email
ORDER BY u.created_at;

-- 2. 孤立したメッセージ（会話が削除されているが残っているメッセージ）を確認
SELECT 
  cm.id,
  cm.conversation_id,
  cm.role,
  LEFT(cm.content, 100) as content_preview,
  cm.created_at
FROM chat_messages cm
LEFT JOIN conversations c ON cm.conversation_id = c.id
WHERE c.id IS NULL;

-- 3. 孤立したメッセージを削除（実行する場合はコメントを外す）
-- DELETE FROM chat_messages 
-- WHERE conversation_id NOT IN (
--   SELECT id FROM conversations
-- );

-- 4. 重複した会話タイトルを持つ会話を確認
WITH duplicate_titles AS (
  SELECT 
    user_id,
    title,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as conversation_ids,
    STRING_AGG(created_at::text, ', ') as created_ats
  FROM conversations
  GROUP BY user_id, title
  HAVING COUNT(*) > 1
)
SELECT * FROM duplicate_titles ORDER BY count DESC;

-- 5. メッセージを持たない古い会話を確認（30日以上前）
SELECT 
  c.id,
  c.title,
  c.created_at,
  c.user_id
FROM conversations c
LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
WHERE cm.id IS NULL
  AND c.created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY c.created_at;

-- 6. 古い空の会話を削除（実行する場合はコメントを外す）
-- DELETE FROM conversations
-- WHERE id IN (
--   SELECT c.id
--   FROM conversations c
--   LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
--   WHERE cm.id IS NULL
--     AND c.created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
-- );

-- 7. 各ユーザーの会話数を確認（整理後）
SELECT 
  u.email,
  COUNT(c.id) as total_conversations,
  COUNT(CASE WHEN cm.id IS NOT NULL THEN c.id END) as conversations_with_messages,
  COUNT(CASE WHEN cm.id IS NULL THEN c.id END) as empty_conversations
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id
LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
GROUP BY u.email
ORDER BY total_conversations DESC; 