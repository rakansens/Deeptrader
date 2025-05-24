-- migrate:up
-- 空の会話を削除するためのヘルパースクリプト
-- 作成日: 2025/6/1
-- 更新内容: メッセージを持たない空の会話の検出と削除
-- 注意: このスクリプトは破壊的な操作を含みます。実行前にバックアップを取ることを推奨します。

-- 1. 削除対象の確認（メッセージを持たない会話）
WITH empty_conversations AS (
  SELECT 
    c.id,
    c.title,
    c.created_at,
    c.user_id,
    u.email
  FROM conversations c
  JOIN users u ON c.user_id = u.id
  LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
  WHERE cm.id IS NULL
  GROUP BY c.id, c.title, c.created_at, c.user_id, u.email
)
SELECT 
  COUNT(*) as total_empty_conversations,
  COUNT(DISTINCT user_id) as affected_users
FROM empty_conversations;

-- 2. ユーザーごとの空の会話数を確認
SELECT 
  u.email,
  COUNT(c.id) as empty_conversation_count,
  STRING_AGG(c.title, ', ' ORDER BY c.created_at) as conversation_titles
FROM conversations c
JOIN users u ON c.user_id = u.id
LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
WHERE cm.id IS NULL
GROUP BY u.email
ORDER BY empty_conversation_count DESC;

-- 3. 特定のユーザーの空の会話を削除（ユーザーIDを指定）
-- 例: rakansens@gmail.com のユーザーの空の会話を削除
-- DELETE FROM conversations
-- WHERE id IN (
--   SELECT c.id
--   FROM conversations c
--   LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
--   WHERE cm.id IS NULL
--     AND c.user_id = '09f2c2bc-5c01-473e-8e6b-3c09b03334d8'
-- );

-- 4. 全ユーザーの空の会話を一括削除（危険！慎重に実行）
-- DELETE FROM conversations
-- WHERE id IN (
--   SELECT c.id
--   FROM conversations c
--   LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
--   WHERE cm.id IS NULL
-- );

-- 5. 削除後の確認
-- SELECT 
--   u.email,
--   COUNT(c.id) as remaining_conversations,
--   COUNT(CASE WHEN cm.id IS NOT NULL THEN c.id END) as conversations_with_messages
-- FROM users u
-- LEFT JOIN conversations c ON u.id = c.user_id
-- LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
-- GROUP BY u.email
-- ORDER BY remaining_conversations DESC; 