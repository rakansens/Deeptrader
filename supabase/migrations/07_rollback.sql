-- 07_rollback.sql
-- ロールバック用のスクリプト
-- 作成日: 2025/5/20
-- 更新内容: 初期作成、ロールバック手順の定義、DROP SCHEMA storage, 全DROP EXTENSION, storage関連テーブルのDROPを一時的にコメントアウト

/*
このスクリプトは、マイグレーションに問題が発生した場合にロールバックするためのものです。
実行順序は重要です。外部キー制約のあるテーブルは依存関係の逆順で削除する必要があります。

注意:
- このスクリプトは、マイグレーションに問題が発生した場合にのみ実行してください
- 実行前に必ずバックアップを取得してください
- データが完全に失われる可能性があります
*/

-- トランザクション開始
BEGIN;

-- RLSポリシーを削除
-- ユーザー関連
DROP POLICY IF EXISTS "ユーザーは自分のデータのみ読み取り可能" ON users;
DROP POLICY IF EXISTS "ユーザーは自分のデータのみ更新可能" ON users;
DROP POLICY IF EXISTS "管理者はすべてのユーザーデータにアクセス可能" ON users;

-- プロフィール関連
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールのみ読み取り可能" ON profiles;
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールのみ更新可能" ON profiles;
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールのみ削除可能" ON profiles;
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールのみ挿入可能" ON profiles;
DROP POLICY IF EXISTS "管理者はすべてのプロフィールデータにアクセス可能" ON profiles;

-- 会話関連
DROP POLICY IF EXISTS "ユーザーは自分の会話のみアクセス可能" ON conversations;
DROP POLICY IF EXISTS "管理者はすべての会話にアクセス可能" ON conversations;

-- チャットメッセージ関連
DROP POLICY IF EXISTS "ユーザーは自分のメッセージのみアクセス可能" ON chat_messages;
DROP POLICY IF EXISTS "公開メッセージは誰でも読み取り可能" ON chat_messages;
DROP POLICY IF EXISTS "管理者はすべてのメッセージにアクセス可能" ON chat_messages;

-- チャット画像関連
DROP POLICY IF EXISTS "ユーザーは自分の画像のみアクセス可能" ON chat_images;
DROP POLICY IF EXISTS "管理者はすべての画像にアクセス可能" ON chat_images;

-- エントリー関連
DROP POLICY IF EXISTS "ユーザーは自分のエントリーのみアクセス可能" ON entries;
DROP POLICY IF EXISTS "公開エントリーは誰でも読み取り可能" ON entries;
DROP POLICY IF EXISTS "管理者はすべてのエントリーにアクセス可能" ON entries;

-- トレード戦略関連
DROP POLICY IF EXISTS "ユーザーは自分の戦略のみアクセス可能" ON trading_strategies;
DROP POLICY IF EXISTS "管理者はすべての戦略にアクセス可能" ON trading_strategies;

-- 取引履歴関連
DROP POLICY IF EXISTS "ユーザーは自分の取引履歴のみアクセス可能" ON trading_history;
DROP POLICY IF EXISTS "管理者はすべての取引履歴にアクセス可能" ON trading_history;

-- 設定関連
DROP POLICY IF EXISTS "ユーザーは自分のシンボル設定のみアクセス可能" ON symbol_settings;
DROP POLICY IF EXISTS "管理者はすべてのシンボル設定にアクセス可能" ON symbol_settings;
DROP POLICY IF EXISTS "ユーザーは自分のチャート設定のみアクセス可能" ON chart_settings;
DROP POLICY IF EXISTS "管理者はすべてのチャート設定にアクセス可能" ON chart_settings;
DROP POLICY IF EXISTS "ユーザーは自分のインジケーター設定のみアクセス可能" ON indicator_settings;
DROP POLICY IF EXISTS "管理者はすべてのインジケーター設定にアクセス可能" ON indicator_settings;

-- キャッシュデータ関連
DROP POLICY IF EXISTS "すべてのユーザーがキャッシュデータを読み取り可能" ON cached_data;
DROP POLICY IF EXISTS "管理者のみがキャッシュデータを変更可能" ON cached_data;

-- ユーザー関係関連
DROP POLICY IF EXISTS "ユーザーは自分のフォロー関係のみアクセス可能" ON user_relations;
DROP POLICY IF EXISTS "ユーザーは自分をフォローしている関係を読み取り可能" ON user_relations;
DROP POLICY IF EXISTS "管理者はすべてのユーザー関係にアクセス可能" ON user_relations;

-- バックテストデータ関連
DROP POLICY IF EXISTS "ユーザーは自分のバックテストデータのみアクセス可能" ON backtest_data;
DROP POLICY IF EXISTS "管理者はすべてのバックテストデータにアクセス可能" ON backtest_data;

-- メモリ関連
DROP POLICY IF EXISTS "ユーザーは自分のメモリのみアクセス可能" ON memories;
DROP POLICY IF EXISTS "管理者はすべてのメモリにアクセス可能" ON memories;

-- ストレージ関連
DROP POLICY IF EXISTS "認証済みユーザーは公開バケットを読み取り可能" ON storage.buckets;
DROP POLICY IF EXISTS "管理者はすべてのバケットにアクセス可能" ON storage.buckets;
DROP POLICY IF EXISTS "ユーザーは自分のオブジェクトのみアクセス可能" ON storage.objects;
DROP POLICY IF EXISTS "認証済みユーザーは公開バケット内のオブジェクトを読み取り可能" ON storage.objects;
DROP POLICY IF EXISTS "管理者はすべてのオブジェクトにアクセス可能" ON storage.objects;

-- トランザクション終了
COMMIT;

-- インデックスを削除（別トランザクションで実行）
BEGIN;
-- ユーザー関連
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_is_admin;
DROP INDEX IF EXISTS idx_profiles_user_id;

-- 会話関連
DROP INDEX IF EXISTS idx_conversations_user_id;
DROP INDEX IF EXISTS idx_conversations_created_at;
DROP INDEX IF EXISTS idx_conversations_is_archived;
DROP INDEX IF EXISTS idx_conversations_user_archived;

-- チャットメッセージ関連
DROP INDEX IF EXISTS idx_chat_messages_conversation_id;
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chat_messages_role;
DROP INDEX IF EXISTS idx_chat_messages_type;
DROP INDEX IF EXISTS idx_chat_messages_conversation_created;
DROP INDEX IF EXISTS idx_chat_messages_user_conversation;

-- 画像関連
DROP INDEX IF EXISTS idx_chat_images_user_id;

-- トレード関連
DROP INDEX IF EXISTS idx_entries_user_id;
DROP INDEX IF EXISTS idx_entries_symbol;
DROP INDEX IF EXISTS idx_entries_status;
DROP INDEX IF EXISTS idx_entries_time;
DROP INDEX IF EXISTS idx_entries_is_public;
DROP INDEX IF EXISTS idx_entries_user_symbol;
DROP INDEX IF EXISTS idx_entries_user_status;

-- トレード戦略関連
DROP INDEX IF EXISTS idx_trading_strategies_user_id;
DROP INDEX IF EXISTS idx_trading_strategies_is_active;

-- 取引履歴関連
DROP INDEX IF EXISTS idx_trading_history_user_id;
DROP INDEX IF EXISTS idx_trading_history_strategy_id;
DROP INDEX IF EXISTS idx_trading_history_symbol;
DROP INDEX IF EXISTS idx_trading_history_timestamp;
DROP INDEX IF EXISTS idx_trading_history_status;
DROP INDEX IF EXISTS idx_trading_history_user_symbol;
DROP INDEX IF EXISTS idx_trading_history_user_strategy;

-- 設定関連
DROP INDEX IF EXISTS idx_symbol_settings_user_id;
DROP INDEX IF EXISTS idx_symbol_settings_symbol;
DROP INDEX IF EXISTS idx_chart_settings_user_id;
DROP INDEX IF EXISTS idx_indicator_settings_user_id;
DROP INDEX IF EXISTS idx_indicator_settings_chart_settings_id;

-- キャッシュデータ関連
DROP INDEX IF EXISTS idx_cached_data_data_type;
DROP INDEX IF EXISTS idx_cached_data_symbol;
DROP INDEX IF EXISTS idx_cached_data_expires_at;
DROP INDEX IF EXISTS idx_cached_data_type_symbol;

-- ユーザー関係関連
DROP INDEX IF EXISTS idx_user_relations_follower_id;
DROP INDEX IF EXISTS idx_user_relations_following_id;

-- バックテストデータ関連
DROP INDEX IF EXISTS idx_backtest_data_user_id;
DROP INDEX IF EXISTS idx_backtest_data_symbol;
DROP INDEX IF EXISTS idx_backtest_data_timeframe;

-- メモリ関連
DROP INDEX IF EXISTS idx_memories_user_id;
DROP INDEX IF EXISTS idx_memories_external_id;
DROP INDEX IF EXISTS idx_memories_embedding;

-- ストレージ関連
DROP INDEX IF EXISTS idx_storage_objects_bucket_id;
DROP INDEX IF EXISTS idx_storage_objects_name;
DROP INDEX IF EXISTS idx_storage_objects_owner;
DROP INDEX IF EXISTS idx_storage_objects_path;
COMMIT;

-- トリガーを削除（別トランザクションで実行）
BEGIN;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;
DROP TRIGGER IF EXISTS update_trading_strategies_updated_at ON trading_strategies;
DROP TRIGGER IF EXISTS update_trading_history_updated_at ON trading_history;
DROP TRIGGER IF EXISTS update_symbol_settings_updated_at ON symbol_settings;
DROP TRIGGER IF EXISTS update_chart_settings_updated_at ON chart_settings;
DROP TRIGGER IF EXISTS update_indicator_settings_updated_at ON indicator_settings;
DROP TRIGGER IF EXISTS update_cached_data_updated_at ON cached_data;
DROP TRIGGER IF EXISTS update_backtest_data_updated_at ON backtest_data;
DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
COMMIT;

-- ビューを削除（別トランザクションで実行）
BEGIN;
DROP VIEW IF EXISTS admin_users;
COMMIT;

-- テーブルを削除（依存関係の逆順、別トランザクションで実行）
BEGIN;
DROP TABLE IF EXISTS indicator_settings CASCADE;
DROP TABLE IF EXISTS chart_settings CASCADE;
DROP TABLE IF EXISTS symbol_settings CASCADE;
DROP TABLE IF EXISTS backtest_data CASCADE;
DROP TABLE IF EXISTS cached_data CASCADE;
DROP TABLE IF EXISTS user_relations CASCADE;
DROP TABLE IF EXISTS trading_history CASCADE;
DROP TABLE IF EXISTS trading_strategies CASCADE;
DROP TABLE IF EXISTS entries CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_images CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS storage.objects CASCADE; -- Supabaseサービスエラー回避のため一時的にコメントアウト
-- DROP TABLE IF EXISTS storage.buckets CASCADE; -- Supabaseサービスエラー回避のため一時的にコメントアウト
COMMIT;

-- 関数を削除（別トランザクションで実行）
BEGIN;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS match_documents CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS get_conversation_messages CASCADE;
COMMIT;

-- スキーマを削除（別トランザクションで実行）
BEGIN;
-- DROP SCHEMA IF EXISTS storage CASCADE; -- storageスキーマの所有権問題のため一時的にコメントアウト
COMMIT;

-- 拡張機能を削除（別トランザクションで実行）
BEGIN;
-- DROP EXTENSION IF EXISTS "uuid-ossp"; -- 依存関係エラー回避のため一時的にコメントアウト
-- DROP EXTENSION IF EXISTS "pgcrypto"; -- 依存関係エラー回避のため一時的にコメントアウト
-- DROP EXTENSION IF EXISTS "pg_net"; -- 依存関係エラー回避のため一時的にコメントアウト
-- DROP EXTENSION IF EXISTS "vector"; -- 依存関係エラー回避のため一時的にコメントアウト
COMMIT;

-- 注意: このスクリプトを実行すると、すべてのデータが失われます。
-- 実行前に必ずバックアップを取得してください。