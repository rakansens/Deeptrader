-- 重複した会話とメッセージのクリーンアップスクリプト

-- 1. 同じタイトルと作成時刻の重複会話を確認
SELECT 
  title, 
  created_at, 
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as conversation_ids
FROM conversations
WHERE user_id = '09f2c2bc-5c01-473e-8e6b-3c09b03334d8'
GROUP BY title, created_at
HAVING COUNT(*) > 1
ORDER BY created_at DESC;

-- 2. メッセージを持たない会話を確認
SELECT 
  c.id,
  c.title,
  c.created_at,
  COUNT(cm.id) as message_count
FROM conversations c
LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
WHERE c.user_id = '09f2c2bc-5c01-473e-8e6b-3c09b03334d8'
GROUP BY c.id, c.title, c.created_at
HAVING COUNT(cm.id) = 0
ORDER BY c.created_at DESC;

-- 3. 存在しない会話を参照するメッセージを確認（孤立したメッセージ）
SELECT 
  cm.id,
  cm.conversation_id,
  cm.content,
  cm.created_at
FROM chat_messages cm
LEFT JOIN conversations c ON cm.conversation_id = c.id
WHERE c.id IS NULL;

-- 4. 同じ時刻に作成された重複会話を削除（メッセージを持たないものを優先的に削除）
WITH duplicate_conversations AS (
  SELECT 
    c1.id,
    c1.title,
    c1.created_at,
    EXISTS(SELECT 1 FROM chat_messages WHERE conversation_id = c1.id) as has_messages
  FROM conversations c1
  WHERE c1.user_id = '09f2c2bc-5c01-473e-8e6b-3c09b03334d8'
    AND EXISTS (
      SELECT 1 
      FROM conversations c2 
      WHERE c2.user_id = c1.user_id
        AND c2.created_at = c1.created_at
        AND c2.id != c1.id
    )
  ORDER BY c1.created_at, has_messages DESC, c1.id
)
SELECT * FROM duplicate_conversations;

-- 注意: 実際の削除を行う場合は以下のコメントを外してください
-- DELETE FROM conversations 
-- WHERE id IN (
--   SELECT id 
--   FROM duplicate_conversations 
--   WHERE NOT has_messages
-- );

-- 5. LocalStorageクリーンアップのための情報
SELECT 
  'messages_' || id as localStorage_key,
  title,
  created_at
FROM conversations
WHERE user_id = '09f2c2bc-5c01-473e-8e6b-3c09b03334d8'
ORDER BY created_at DESC; 