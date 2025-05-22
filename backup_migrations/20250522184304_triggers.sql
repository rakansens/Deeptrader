-- migrate:up
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
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entries_updated_at
BEFORE UPDATE ON public.entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_strategies_updated_at
BEFORE UPDATE ON public.trading_strategies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_history_updated_at
BEFORE UPDATE ON public.trading_history
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_symbol_settings_updated_at
BEFORE UPDATE ON public.symbol_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_settings_updated_at
BEFORE UPDATE ON public.chart_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicator_settings_updated_at
BEFORE UPDATE ON public.indicator_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cached_data_updated_at
BEFORE UPDATE ON public.cached_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backtest_data_updated_at
BEFORE UPDATE ON public.backtest_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON public.memories
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
-- migrate:down
-- トリガーを削除（別トランザクションで実行）
BEGIN;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON public.chat_messages;
DROP TRIGGER IF EXISTS update_entries_updated_at ON public.entries;
DROP TRIGGER IF EXISTS update_trading_strategies_updated_at ON public.trading_strategies;
DROP TRIGGER IF EXISTS update_trading_history_updated_at ON public.trading_history;
DROP TRIGGER IF EXISTS update_symbol_settings_updated_at ON public.symbol_settings;
DROP TRIGGER IF EXISTS update_chart_settings_updated_at ON public.chart_settings;
DROP TRIGGER IF EXISTS update_indicator_settings_updated_at ON public.indicator_settings;
DROP TRIGGER IF EXISTS update_cached_data_updated_at ON public.cached_data;
DROP TRIGGER IF EXISTS update_backtest_data_updated_at ON public.backtest_data;
DROP TRIGGER IF EXISTS update_memories_updated_at ON public.memories;
COMMIT;
