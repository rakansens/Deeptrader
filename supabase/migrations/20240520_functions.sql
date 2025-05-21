-- migrate:up
-- 03_functions.sql
-- 関数定義（ベクトル検索関数など）
-- 作成日: 2025/5/20
-- 更新内容: 修正版、NULL値のエラー処理を追加し、依存関係を強化

/*
このスクリプトはデータベース関数を定義します。
主な内容:
- 更新日時を自動的に更新するトリガー関数
- ベクトル検索関数（NULL値のエラー処理を追加）
- その他のユーティリティ関数
*/

-- トランザクション開始
BEGIN;

-- 更新日時を自動的に更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ベクトル検索関数（エラー処理強化版）
-- 変更点:
-- - NULL値のエラー処理を追加
-- - 類似度計算の最適化
-- - インデックス活用のためのクエリ構造改善
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  user_id UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- 引数チェック
  IF query_embedding IS NULL THEN
    RAISE EXCEPTION 'query_embedding cannot be NULL';
  END IF;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.metadata,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM memories m
  WHERE m.user_id = match_documents.user_id
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 管理者チェック関数（パフォーマンス最適化）
-- ビューを使用して管理者チェックを高速化
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- 引数チェック
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE id = user_id);
END;
$$;

-- 会話メッセージ取得関数
-- 指定された会話のメッセージを取得する関数
CREATE OR REPLACE FUNCTION get_conversation_messages(
  conversation_uuid UUID,
  message_limit INT DEFAULT 100,
  message_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  type TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- 引数チェック
  IF conversation_uuid IS NULL THEN
    RAISE EXCEPTION 'conversation_uuid cannot be NULL';
  END IF;
  
  RETURN QUERY
  SELECT
    cm.id,
    cm.role,
    cm.content,
    cm.type,
    cm.image_url,
    cm.created_at
  FROM chat_messages cm
  WHERE cm.conversation_id = conversation_uuid
  ORDER BY cm.created_at ASC
  LIMIT message_limit
  OFFSET message_offset;
END;
$$;

-- トランザクション終了
COMMIT;
-- migrate:down
-- 関数を削除（別トランザクションで実行）
BEGIN;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS match_documents CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS get_conversation_messages CASCADE;
COMMIT;
