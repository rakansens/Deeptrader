-- 04_triggers.sql
-- トリガー定義
-- 作成日: 2025/5/20
-- 更新内容: 初期作成、全テーブルのトリガー定義

/*
このスクリプトはデータベーストリガーを定義します。
主な内容:
- 各テーブルの更新日時を自動的に更新するトリガー
- 長時間実行される操作を別トランザクションに分割
*/

-- トランザクション開始
BEGIN;

-- 各テーブルに更新日時トリガーを設定
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON chat_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entries_updated_at
BEFORE UPDATE ON entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_strategies_updated_at
BEFORE UPDATE ON trading_strategies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_history_updated_at
BEFORE UPDATE ON trading_history
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_symbol_settings_updated_at
BEFORE UPDATE ON symbol_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_settings_updated_at
BEFORE UPDATE ON chart_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicator_settings_updated_at
BEFORE UPDATE ON indicator_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cached_data_updated_at
BEFORE UPDATE ON cached_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backtest_data_updated_at
BEFORE UPDATE ON backtest_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON memories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- トランザクション終了
COMMIT;

-- 注意: 以下は長時間実行される可能性のある操作のため、別トランザクションで実行
-- これにより、メインのマイグレーションが長時間ロックされることを防ぎます

-- ベクトルインデックスの再構築（必要な場合）
-- BEGIN;
-- REINDEX INDEX idx_memories_embedding;
-- COMMIT;

-- 大量データの移行（必要な場合）
-- BEGIN;
-- -- 大量データの移行コード
-- COMMIT;

-- 統計情報の更新（必要な場合）
-- BEGIN;
-- ANALYZE memories;
-- ANALYZE chat_messages;
-- COMMIT;