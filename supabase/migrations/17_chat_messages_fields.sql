-- 17_chat_messages_fields.sql
-- チャットメッセージテーブルに画像URL機能関連のフィールドを追加
-- 作成日: 2024/05/26

-- チャットメッセージにタイプフィールドを追加
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image'));

-- チャットメッセージにプロンプトフィールドを追加
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS prompt TEXT;

-- チャットメッセージに画像URLフィールドを追加
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS image_url TEXT; 